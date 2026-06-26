import { Request, Response } from "express";
import { sendResp } from "../../utils/resp";
import { HTTP_STATUS } from "../../utils/statusCodes";
import {
  openproviderRequest,
} from "../../lib/openProvider";
import { calculateRetailPriceNGN } from "../../utils/pricing";
import { AuthRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../lib/prisma";

const extensions = [
  "com",
  "net",
  "org",
  "io",
  "co",
  "info",
  "me",
];

export const searchAvailableDomains = async (req: Request, res: Response) => {
  try {
    const { term } = req.query;

    if (!term || typeof term !== "string") {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Search term is required");
    }

    const raw = term.trim().toLowerCase();

    // remove TLD if user included one
    const name = raw.split(".")[0];

    const domains = extensions.map((ext) => ({
      extension: ext,
      name,
    }));

    const response = await openproviderRequest("POST", "/domains/check", {
      domains: domains,
      with_price: true,
    });

    const results = response.data?.data?.results || [];

    const formatted = results.map((item: any) => {
      const wholesalePrice = item.price?.product?.price ?? 0;
      const wholesaleCurrency = item.price?.product?.currency ?? "USD";

      return {
        domain: item.domain,
        available: item.status === "free",
        isPremium: item.is_premium || false,
        price: {
          price: calculateRetailPriceNGN(wholesalePrice, wholesaleCurrency),
          currency: "NGN",
        },
      };
    });
    return sendResp(
      res,
      HTTP_STATUS.OK,
      "Domain availability fetched successfully",
      formatted,
    );
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong searching domains",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

// GET /domains — list everything the logged-in user owns
export const getDomains = async (req: AuthRequest, res: Response) => {
  try {
    const domains = await prisma.domain.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
 
    return sendResp(res, HTTP_STATUS.OK, "", domains);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting domains",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const getDomainById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
 
    const domain = await prisma.domain.findFirst({
      where: { id, userId: req.userId },
    });
 
    if (!domain) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Domain not found");
    }
 
    return sendResp(res, HTTP_STATUS.OK, "", domain);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting domain",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
