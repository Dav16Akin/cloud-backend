// middleware/admin.middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { prisma } from "../lib/prisma";
import { sendResp } from "../utils/resp";
import { HTTP_STATUS } from "../utils/statusCodes";

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    console.log("user: ", user);
    

    if (!user || user.role !== "ADMIN") {
      return sendResp(res, HTTP_STATUS.FORBIDDEN, "Admin access required");
    }

    return next();
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Failed to verify admin access",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};