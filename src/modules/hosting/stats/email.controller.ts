import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { prisma } from "../../../lib/prisma";
import { HTTP_STATUS } from "../../../utils/statusCodes";
import { sendResp } from "../../../utils/resp";
import whmClient from "../../../lib/whm";
import { createEmailHostingSchema, createForwarderSchema } from "../validations/email.validations";


export const getHostingEmails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const hosting = await prisma.hostingAccount.findUnique({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    if (hosting.status !== "ACTIVE") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Hosting account must be active to manage emails",
      );
    }

    const response = await whmClient.get("/json-api/cpanel", {
      params: {
        "api.version": 1,
        cpanel_jsonapi_user: hosting.cpanelUsername,
        cpanel_jsonapi_module: "Email",
        cpanel_jsonapi_func: "list_pops_with_disk",
        cpanel_jsonapi_apiversion: 3,
      },
    });

    const emails = response.data?.result?.data;

    if (!emails || emails.length === 0) {
      return sendResp(res, HTTP_STATUS.OK, "No emails found", []);
    }

    const shaped = emails
      .filter((email: any) => email.login !== "Main Account")
      .map((email: any) => ({
        email: email.email,
        login: email.login,
        diskquota: email.diskquota,
        diskused: email.diskused,
      }));

    return sendResp(res, HTTP_STATUS.OK, "", shaped);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting hosting emails",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const createHostingEmail = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createEmailHostingSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid input",
        null,
        parsed.error.issues.map((error) => error.message),
      );
    }

    const { password: emailPassword, email } = parsed.data;
    const { id } = req.params as { id: string };

    const hosting = await prisma.hostingAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    if (hosting.status !== "ACTIVE") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Hosting account must be active to manage emails",
      );
    }

    const response = await whmClient.get("json-api/cpanel", {
      params: {
        "api.version": 1,
        cpanel_jsonapi_user: hosting.cpanelUsername,
        cpanel_jsonapi_module: "Email",
        cpanel_jsonapi_func: "add_pop",
        cpanel_jsonapi_apiversion: 3,
        domain: hosting.domain,
        email: email,
        password: emailPassword,
        quota: 250,
      },
    });

    const result = response.data.result;

    if (!result || result.status !== 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        result?.errors?.[0] || "Failed to create email",
      );
    }

    return sendResp(res, HTTP_STATUS.CREATED, "email created successfully", {
      email: `${parsed.data.email}@${hosting.domain}`,
      webmail: `https://${hosting.domain}/webmail`,
      imapHost: `mail.${hosting.domain}`,
      imapPort: 993,
      smtpHost: `mail.${hosting.domain}`,
      smtpPort: 465,
      ssl: true,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong creating hosting email",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const deleteHostingEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { id, email } = req.params as { id: string; email: string };

    const decodedEmail = decodeURIComponent(email);

    const [user, domain] = decodedEmail.split("@");

    const hosting = await prisma.hostingAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    if (hosting.status !== "ACTIVE") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Hosting account must be active to manage emails",
      );
    }

    const response = await whmClient.get("/json-api/cpanel", {
      params: {
        "api.version": 1,
        cpanel_jsonapi_user: hosting.cpanelUsername,
        cpanel_jsonapi_module: "Email",
        cpanel_jsonapi_func: "delete_pop",
        cpanel_jsonapi_apiversion: 3,
        domain: domain,
        email: user,
      },
    });

    const result = response.data.result;

    if (!result || result.status !== 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        result?.errors?.[0] || "Something went wrong",
      );
    }

    return sendResp(res, HTTP_STATUS.OK, "Email deleted successfully");
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong deleting hosting email",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const changeHostingEmailPassword = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id, email } = req.params as { id: string; email: string };

    const decodedEmail = decodeURIComponent(email);

    const [user, domain] = decodedEmail.split("@");

    const hosting = await prisma.hostingAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    if (hosting.status !== "ACTIVE") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Hosting account must be active to manage emails",
      );
    }

    const response = await whmClient.get("/json-api/cpanel", {
      params: {
        "api.version": 1,
        cpanel_jsonapi_user: hosting.cpanelUsername,
        cpanel_jsonapi_module: "Email",
        cpanel_jsonapi_func: "passwd_pop",
        cpanel_jsonapi_apiversion: 3,
        domain: domain,
        email: user,
      },
    });

    const result = response.data.result;

    if (!result || result.status !== 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        result.errors?.[0] || "Failed to change email password",
      );
    }

    return sendResp(res, HTTP_STATUS.OK, "Email password changed successfully");
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong changing email password",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const getHostingEmailForwarders = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params as { id: string };

    const hosting = await prisma.hostingAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    if (hosting.status !== "ACTIVE") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Hosting account must be active to manage emails",
      );
    }

    const response = await whmClient.get("/json-api/cpanel", {
      params: {
        "api.version": 1,
        cpanel_jsonapi_user: hosting.cpanelUsername,
        cpanel_jsonapi_module: "Email",
        cpanel_jsonapi_func: "list_forwarders",
        cpanel_jsonapi_apiversion: 3,
      },
    });

    console.log("Raw response:", JSON.stringify(response.data, null, 2));

    const result = response.data.result;

    if (!result || result.status !== 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        result?.errors?.[0] || "Failed to get email forwarders list",
      );
    }

    return sendResp(res, HTTP_STATUS.OK, "", result);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting email forwarders",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const createHostingEmailForwarder = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const parsed = createForwarderSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid input",
        null,
        parsed.error.issues.map((e) => e.message),
      );
    }

    const { id } = req.params as { id: string };
    const { source, destination } = parsed.data;

    const hosting = await prisma.hostingAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    if (hosting.status !== "ACTIVE") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Hosting account must be active to manage emails",
      );
    }

    const response = await whmClient.get("/json-api/cpanel", {
      params: {
        "api.version": 1,
        cpanel_jsonapi_user: hosting.cpanelUsername,
        cpanel_jsonapi_module: "Email",
        cpanel_jsonapi_func: "add_forwarder",
        cpanel_jsonapi_apiversion: 3,
        domain: hosting.domain,
        email: source,
        fwdopt: "fwd",
        fwdemail: destination,
      },
    });

    const result =  response.data?.result;

    if (!result || result.status !== 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        result.errors?.[0] || "Something went wrong adding forwarder",
      );
    }

    return sendResp(res, HTTP_STATUS.OK, "Forwarder created successfully");
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong creating email forwarder",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const deleteHostingEmailForwarder = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params as { id: string };
    const { address, forwarder } = req.query as {
      address?: string;
      forwarder?: string;
    };

    if (!address || !forwarder) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Missing required query parameters: address and forwarder",
      );
    }

    const hosting = await prisma.hostingAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    if (hosting.status !== "ACTIVE") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Hosting account must be active to manage emails",
      );
    }

    const response = await whmClient.get("/json-api/cpanel", {
      params: {
        "api.version": 1,
        cpanel_jsonapi_user: hosting.cpanelUsername,
        cpanel_jsonapi_module: "Email",
        cpanel_jsonapi_func: "delete_forwarder",
        cpanel_jsonapi_apiversion: 3,
        address: decodeURIComponent(address),
        forwarder: decodeURIComponent(forwarder),
      },
    });

    const result = response.data.result;

    if (!result || result.status !== 1) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        result.errors?.[0] || "Something went wrong",
      );
    }

    return sendResp(res, HTTP_STATUS.OK, "Forwarder deleted successfully");
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong deleting email forwarder",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};