// Add to a suitable admin-facing controller, e.g. src/modules/admin/admin.controller.ts
// This assumes you have some form of admin-only route protection already
// (role check via your existing Role enum) — adjust the middleware accordingly.

import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import { HTTP_STATUS } from "../utils/statusCodes";
import { sendResp } from "../utils/resp";
import { createWhmcsClient } from "../lib/whmcs";


const countryCodeMap: Record<string, string> = {
  Nigeria: "NG",
};

// GET /admin/whmcs-sync-gaps — see exactly who is missing a WHMCS client
export const getWhmcsSyncGaps = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { whmcsClientId: null },
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return sendResp(res, HTTP_STATUS.OK, `${users.length} users missing WHMCS sync`, users);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong checking sync gaps",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

// POST /admin/whmcs-sync-gaps/:userId/retry — manually retry one user
export const retryWhmcsSync = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendResp(res, HTTP_STATUS.NOT_FOUND, "User not found");

    if (user.whmcsClientId) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "User already has a WHMCS client");
    }

    const whmcsClientId = await createWhmcsClient({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      address: user.address,
      city: user.city,
      state: user.state,
      country: countryCodeMap[user.country] ?? user.country,
      postcode: user.postcode,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { whmcsClientId },
    });

    return sendResp(res, HTTP_STATUS.OK, "WHMCS client created successfully", { whmcsClientId });
  } catch (error) {
    // This time, the actual OpenProvider/WHMCS error message reaches you
    // directly in the API response, instead of disappearing into a log
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "WHMCS sync retry failed",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};