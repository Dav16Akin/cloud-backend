import { Request, Response } from "express";
import { sendResp } from "../../utils/resp";
import { HTTP_STATUS } from "../../utils/statusCodes";
import { openproviderRequest } from "../../lib/openProvider";

const extensions = [
  "com",
  "net",
  "org",
  "io",
  "co",
  "ng",
  "com.ng",
  "africa",
  "app",
  "dev",
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

    const formatted = results.map((item: any) => ({
      domain: item.domain,
      available: item.status === "free",
      isPremium: item.is_premium || false,
      price: {
        price: item.price?.product?.price ?? null,
        currency: item.price?.product?.currency ?? null,
      },
    }));
    return sendResp(
      res,
      HTTP_STATUS.OK,
      "Domain availability fetched successfully",
      formatted
    );
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong searching domains",
      null,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};