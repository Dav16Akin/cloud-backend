import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { HTTP_STATUS } from "../../../utils/statusCodes";
import { sendResp } from "../../../utils/resp";
import { prisma } from "../../../lib/prisma";
import { generateCpanelUsername, parseDiskValue } from "../../../utils/utils";
import whmClient from "../../../lib/whm";
import crypto from "crypto";
import { provisionHostingSchema } from "../validations/account.validations";

export const provisionHosting = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = provisionHostingSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid credentials",
        null,
        parsed.error.issues.map((error) => error.message),
      );
    }

    const { planId, domain } = parsed.data;

    //Get plan
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Plan not found");
    }

    //Get the user
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "User not found");
    }

    const paidOrder = await prisma.order.findFirst({
      where: {
        userId: req.userId!,
        planId: parsed.data.planId,
        status: "PAID",
        hostingAccount: null, // not yet provisioned
      },
    });

    if (!paidOrder) {
      return sendResp(
        res,
        HTTP_STATUS.FORBIDDEN,
        "You need a paid order to provision hosting",
      );
    }

    const existingDomain = await prisma.hostingAccount.findUnique({
      where: { domain },
    });

    if (existingDomain) {
      return sendResp(res, HTTP_STATUS.CONFLICT, "Domain is already in use");
    }

    const cpanelUsername = generateCpanelUsername(
      user.firstName,
      user.lastName,
    );
    
    const cpanelPassword =
      crypto.randomBytes(12).toString("base64").slice(0, 12) + "A1!";

    const whmResponse = await whmClient.get("/json-api/createacct", {
      params: {
        "api.version": 1,
        username: cpanelUsername,
        domain: domain,
        password: cpanelPassword,
        plan: plan.name, // must match a package name in WHM
        contactemail: user.email,
        maxsub: plan.emails,
        quota: plan.storage.replace(/[^0-9]/g, ""), // extract number from "2GB SSD"
      },
    });

    if (whmResponse.data.metadata.result !== 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        "Failed to create hosting account on server",
      );
    }

    const hostingAccount = await prisma.hostingAccount.create({
      data: {
        userId: req.userId!,
        planId: plan.id,
        cpanelUsername,
        domain,
        serverIp: process.env.WHM_HOST!,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    await prisma.order.update({
      where: { id: paidOrder.id },
      data: { hostingAccount: { connect: { id: hostingAccount.id } } },
    });

    return sendResp(res, HTTP_STATUS.CREATED, "Hosting account created", {
      id: hostingAccount.id,
      domain: hostingAccount.domain,
      cpanelUsername,
      cpanelPassword, // only time we return the password
      cpanelUrl: `${process.env.WHM_HOST?.replace("2087", "2083")}`,
      status: hostingAccount.status,
      expiresAt: hostingAccount.expiresAt,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong provisioning hosting",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const getHostings = async (req: AuthRequest, res: Response) => {
  try {
    const hostings = await prisma.hostingAccount.findMany({
      where: { userId: req.userId },
      include: { plan: true },
    });
    if (hostings.length === 0) {
      return sendResp(res, HTTP_STATUS.OK, "No hosting accounts found");
    }
    return sendResp(res, HTTP_STATUS.OK, "", hostings);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting hostings",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const getHostingById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const hosting = await prisma.hostingAccount.findUnique({
      where: { id, userId: req.userId },
    });
    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    return sendResp(res, HTTP_STATUS.OK, "", hosting);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting hosting",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const deleteHostingById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const hosting = await prisma.hostingAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    if (hosting.status === "TERMINATED") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Account is already terminated",
      );
    }

    const whmResponse = await whmClient.get("/json-api/removeacct", {
      params: {
        "api.version": 1,
        username: hosting.cpanelUsername,
      },
    });

    if (whmResponse.data.metadata.result !== 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        "Failed to terminate hosting service",
      );
    }

    await prisma.hostingAccount.update({
      where: { id },
      data: { status: "TERMINATED" },
    });

    return sendResp(res, HTTP_STATUS.OK, "Hosting terminated successfully");
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong terminating hosting",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const suspendHosting = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const hosting = await prisma.hostingAccount.findUnique({
      where: { id, userId: req.userId },
    });
    if (!hosting) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting not found");
    }

    if (hosting.status === "SUSPENDED") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Account is already suspended",
      );
    }

    if (hosting.status === "TERMINATED") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Cannot suspend a terminated account",
      );
    }

    const whmResponse = await whmClient.get("/json-api/suspendacct", {
      params: {
        "api.version": 1,
        username: hosting.cpanelUsername,
        reason: "Suspended by user", // optional
      },
    });

    if (whmResponse.data.metadata.result != 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        "Failed to suspend hosting",
      );
    }

    await prisma.hostingAccount.update({
      where: { id },
      data: {
        status: "SUSPENDED",
      },
    });

    return sendResp(res, HTTP_STATUS.OK, "Hosting suspended successfully");
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong suspending hosting",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const unsuspendHosting = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const hosting = await prisma.hostingAccount.findUnique({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting not found");
    }

    if (hosting.status === "ACTIVE") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Account is already active",
      );
    }

    const whmResponse = await whmClient.get("/json-api/unsuspendacct", {
      params: {
        "api.version": 1,
        username: hosting.cpanelUsername,
      },
    });

    if (whmResponse.data.metadata.result != 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        "Failed to unsuspend hosting",
      );
    }

    await prisma.hostingAccount.update({
      where: { id },
      data: {
        status: "ACTIVE",
      },
    });

    return sendResp(res, HTTP_STATUS.OK, "Hosting unsuspended successfully");
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong unsuspending hosting",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const hosting = await prisma.hostingAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    const whmResponse = await whmClient.get("/json-api/accountsummary", {
      params: {
        "api.version": 1,
        user: hosting.cpanelUsername,
      },
    });

    if (whmResponse.data.metadata.result !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR, "No data found");
    }

    const account = whmResponse.data.data.acct[0];

    return sendResp(res, HTTP_STATUS.OK, "", {
      domain: account.domain,
      plan: account.plan,
      ip: account.ip,

      // disk
      diskUsed: parseDiskValue(account.diskused),
      diskLimit: parseDiskValue(account.disklimit),
      inodesUsed: account.inodesused,
      inodesLimit: account.inodeslimit,

      // limits
      maxEmails: account.maxpop,
      maxFTP: account.maxftp,
      maxDatabases: account.maxsql,
      maxSubdomains: account.maxsub,
      maxAddonDomains: account.maxaddons,

      // email
      maxEmailPerHour: account.max_email_per_hour,
      maxEmailQuotaMB: account.max_emailacct_quota,

      // status
      status: account.suspended ? "SUSPENDED" : "ACTIVE",
      suspendReason: account.suspendreason,
      startDate: account.startdate,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting hosting stats",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
