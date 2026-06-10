import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { sendResp } from "../../../utils/resp";
import { HTTP_STATUS } from "../../../utils/statusCodes";
import { prisma } from "../../../lib/prisma";
import whmClient from "../../../lib/whm";
import { getCpanelResult } from "../../../lib/cpanelHelper";
import { createDNSRecordSchema, updateDNSRecordSchema } from "../validations/dns.validations";

const getHosting = async (id: string, userId: string) => {
  return prisma.hostingAccount.findFirst({ where: { id, userId } });
};

// DNS uses WHM API directly, not cPanel UAPI
// because DNS zones are managed at server level
const dnsCall = (func: string, extra?: object) =>
  whmClient.get(`/json-api/${func}`, {
    params: {
      "api.version": 1,
      ...extra,
    },
  });

// GET /hosting/:id/dns
export const getDNSRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const response = await dnsCall("dumpzone", {
      domain: hosting.domain,
    });

    if (response.data?.metadata?.result !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Failed to get DNS records");
    }

    const records = response.data?.data?.zone?.[0]?.record ?? [];

    // shape and filter out system records
    const shaped = records
      .filter((r: any) => r.type !== "SOA")
      .map((r: any) => ({
        line: r.line,
        name: r.name,
        type: r.type,
        address: r.address || r.cname || r.exchange || r.txtdata,
        ttl: r.ttl,
        priority: r.priority ?? null,
      }));

    return sendResp(res, HTTP_STATUS.OK, "", shaped);
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong getting DNS records",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// POST /hosting/:id/dns
export const createDNSRecord = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createDNSRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Invalid input", null,
        parsed.error.issues.map((e) => e.message));
    }

    const { id } = req.params as { id: string };
    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const { name, type, address, ttl, priority } = parsed.data;

    const response = await dnsCall("addzonerecord", {
      domain: hosting.domain,
      name,
      type,
      address,
      ttl,
      ...(priority && { priority }),
    });

    if (response.data?.metadata?.result !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR,
        response.data?.metadata?.reason || "Failed to create DNS record");
    }

    return sendResp(res, HTTP_STATUS.CREATED, "DNS record created successfully");
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong creating DNS record",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// PATCH /hosting/:id/dns/:recordId
export const updateDNSRecord = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateDNSRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Invalid input", null,
        parsed.error.issues.map((e) => e.message));
    }

    const { id } = req.params as { id: string };
    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const { line, name, type, address, ttl, priority } = parsed.data;

    const response = await dnsCall("editzonerecord", {
      domain: hosting.domain,
      line,
      name,
      type,
      address,
      ttl,
      ...(priority && { priority }),
    });

    if (response.data?.metadata?.result !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR,
        response.data?.metadata?.reason || "Failed to update DNS record");
    }

    return sendResp(res, HTTP_STATUS.OK, "DNS record updated successfully");
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong updating DNS record",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// DELETE /hosting/:id/dns/:recordId
export const deleteDNSRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id, recordId } = req.params as { id: string; recordId: string };

    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const response = await dnsCall("removezonerecord", {
      domain: hosting.domain,
      line: Number(recordId),
    });

    if (response.data?.metadata?.result !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR,
        response.data?.metadata?.reason || "Failed to delete DNS record");
    }

    return sendResp(res, HTTP_STATUS.OK, "DNS record deleted successfully");
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong deleting DNS record",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};