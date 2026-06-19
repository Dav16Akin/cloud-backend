import { Request, Response } from "express";
import { sendResp } from "../../utils/resp";
import { HTTP_STATUS } from "../../utils/statusCodes";
import {
  createOpenProviderCustomerHandle,
  openproviderRequest,
  registerDomainWithOpenProvider,
} from "../../lib/openProvider";
import { calculateRetailPriceNGN } from "../../utils/pricing";
import { AuthRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../lib/prisma";
import { countryCodeMap } from "../../utils/countryCodes";

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

export const registerDomain = async (req: AuthRequest, res: Response) => {
  try {
    const { domain, nameservers } = req.body as {
      domain: string; // e.g. "nupatcloud.com"
      nameservers?: string[];
    };

    if (!domain || typeof domain !== "string") {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Domain is required");
    }

    const [name, ...extParts] = domain.toLowerCase().split(".");
    const extension = extParts.join(".");

    if (!name || !extension) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Invalid domain format");
    }

    // 1. Make sure this domain isn't already registered through us
    const existing = await prisma.domain.findUnique({
      where: { name: domain },
    });
    if (existing) {
      return sendResp(
        res,
        HTTP_STATUS.CONFLICT,
        "This domain is already registered",
      );
    }

    // 2. Get user
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "User not found");
    }

    // 3. Re-check live availability + price right before charging —
    // prices/availability can change between search and purchase
    // (TODO: call openproviderRequest("POST", "/domains/check", ...) here
    // for the single domain+extension, mirroring searchAvailableDomains)

    if (!user.houseNumber) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Please add your house/street number to your profile before purchasing a domain",
      );
    }

    // 4. Create OpenProvider customer handle if this user doesn't have one yet
    let ownerHandle = user.openproviderHandle;
    if (!ownerHandle) {
      ownerHandle = await createOpenProviderCustomerHandle({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        streetAddress: user.address,
        houseNumber: user.houseNumber,
        city: user.city,
        state: user.state,
        countryCode: countryCodeMap[user.country] ?? user.country,
        postcode: user.postcode,
        companyName: user.companyName,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { openproviderHandle: ownerHandle },
      });
    }

    // 5. TODO: charge the user via Paystack BEFORE registering the domain —
    // this controller assumes payment already happened, mirroring how
    // provisionHosting requires a PAID order first. Wire this the same way:
    // check for a PAID order/domain-purchase record before proceeding.

    // 6. Register with OpenProvider
    const result = await registerDomainWithOpenProvider({
      domainName: name,
      extension,
      ownerHandle,
      nameservers,
    });

    // 7. Calculate what we're recording as "price paid" — this should match
    // whatever was actually charged in step 5, not be recalculated here
    const pricePaidPlaceholder = calculateRetailPriceNGN(0, "USD"); // TODO replace with real charged amount

    // 8. Save to our DB
    const domainRecord = await prisma.domain.create({
      data: {
        userId: user.id,
        name: domain,
        extension,
        openproviderId: result.openproviderId,
        authCode: result.authCode,
        status: result.status === "ACT" ? "ACTIVE" : "PENDING",
        nameservers: nameservers ?? [],
        registeredAt: new Date(result.activationDate),
        expiresAt: new Date(result.expirationDate),
        pricePaid: pricePaidPlaceholder,
      },
    });

    return sendResp(
      res,
      HTTP_STATUS.CREATED,
      "Domain registered successfully",
      {
        id: domainRecord.id,
        domain: domainRecord.name,
        status: domainRecord.status,
        expiresAt: domainRecord.expiresAt,
      },
    );
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong registering the domain",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
