import { Request, Response } from "express";
import { HTTP_STATUS } from "../../utils/statusCodes";
import { sendResp } from "../../utils/resp";
import { prisma } from "../../lib/prisma";

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    return sendResp(res, HTTP_STATUS.OK, "", plans);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting plans",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const getPlan = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const plan = await prisma.plan.findUnique({ where: { id } });

    if (!plan) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Plan not found");
    }

    return sendResp(res, HTTP_STATUS.OK, "", plan);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting plan",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
