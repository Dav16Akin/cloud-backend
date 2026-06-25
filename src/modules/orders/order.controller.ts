import crypto from "crypto";
import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { sendResp } from "../../utils/resp";
import { HTTP_STATUS } from "../../utils/statusCodes";
import { prisma } from "../../lib/prisma";
import paystackClient from "../../lib/paystack";
import { createWhmcsInvoice, markWhmcsInvoicePaid } from "../../lib/whmcs";
import { calculateRetailPriceNGN } from "../../utils/pricing";
import {
  createOpenProviderCustomerHandle,
  openproviderRequest,
} from "../../lib/openProvider";
import { provisionOrderItems } from "./provisionOrderItems";

// What the frontend sends us — a cart, not a single plan
type CartItem =
  | { type: "HOSTING"; planId: string }
  | { type: "DOMAIN"; domainName: string; extension: string }
  | { type: "SSL"; domainName: string };

export const initializeCartPayment = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { items } = req.body as { items: CartItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Cart is empty");
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return sendResp(res, HTTP_STATUS.NOT_FOUND, "User not found");

    const countryCodeMap: Record<string, string> = {
      Nigeria: "NG",
    };
    
    const needsOpenProviderHandle = items.some(
      (item) => item.type === "DOMAIN" || item.type === "SSL",
    );

  
    if (needsOpenProviderHandle && !user.openproviderHandle) {
      
      if (!user.houseNumber) {
        return sendResp(
          res,
          HTTP_STATUS.BAD_REQUEST,
          "Please add your house/street number to your profile before purchasing a domain",
        );
      }

      const handle = await createOpenProviderCustomerHandle({
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
        data: { openproviderHandle: handle },
      });
      // Important: keep using the freshly-saved value for the rest of this
      // request — `user.openproviderHandle` itself is stale (the object was
      // fetched before this update), so later code that reads `user.openproviderHandle`
      // would otherwise still see null even though the DB now has it.
      user.openproviderHandle = handle;
    }

    type DraftItem = {
      type: "HOSTING" | "DOMAIN" | "SSL";
      price: number;
      planId?: string;
      domainName?: string;
    };

    const itemsToCreate: DraftItem[] = [];

    for (const item of items) {
      if (item.type === "HOSTING") {
        const plan = await prisma.plan.findUnique({
          where: { id: item.planId },
        });
        if (!plan) {
          return sendResp(
            res,
            HTTP_STATUS.NOT_FOUND,
            `Plan not found: ${item.planId}`,
          );
        }
        itemsToCreate.push({
          type: "HOSTING",
          price: plan.price,
          planId: plan.id,
        });
      }

      if (item.type === "DOMAIN") {
        const check = await openproviderRequest("POST", "/domains/check", {
          domains: [{ name: item.domainName, extension: item.extension }],
          with_price: true,
        });
        const result = check.data?.data?.results?.[0];
        if (!result || result.status !== "free") {
          return sendResp(
            res,
            HTTP_STATUS.CONFLICT,
            `Domain no longer available: ${item.domainName}.${item.extension}`,
          );
        }
        const wholesalePrice = result.price?.product?.price ?? 0;
        const wholesaleCurrency = result.price?.product?.currency ?? "USD";
        const retailPrice = calculateRetailPriceNGN(
          wholesalePrice,
          wholesaleCurrency,
        );

        itemsToCreate.push({
          type: "DOMAIN",
          price: retailPrice,
          domainName: `${item.domainName}.${item.extension}`,
        });
      }

      if (item.type === "SSL") {
        itemsToCreate.push({
          type: "SSL",
          price: calculateRetailPriceNGN(15, "USD"),
          domainName: item.domainName,
        });
      }
    }

    // Use Math.round to avoid floating-point kobo amounts (e.g. 1400.005 * 100 ≠ integer)
    const totalAmount = itemsToCreate.reduce((sum, i) => sum + i.price, 0);
    const totalKobo = Math.round(totalAmount * 100);

    const paystackResponse = await paystackClient.post(
      "/transaction/initialize",
      {
        email: user.email,
        amount: totalKobo,
        currency: "NGN",
        callback_url: `${process.env.FRONTEND_URL}/dashboard/orders/verify`,
        metadata: { userId: user.id },
      },
    );
    
    if (!paystackResponse.data.status) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        "Failed to initialize payment",
      );
    }

    const { reference, authorization_url } = paystackResponse.data.data;

    await prisma.order.create({
      data: {
        user: { connect: { id: user.id } },
        amount: totalAmount,
        status: "PENDING",
        paystackRef: reference,
        items: {
          create: itemsToCreate.map((item) => ({
            type: item.type,
            price: item.price,
            domainName: item.domainName,
            ...(item.planId ? { plan: { connect: { id: item.planId } } } : {}),
          })),
        },
      },
    });

    return sendResp(res, HTTP_STATUS.OK, "Payment initialized", {
      paymentUrl: authorization_url,
      reference,
      total: totalAmount,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong initializing payment",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

// POST /orders/webhook (no auth - called by Paystack)
export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    const { event, data } = req.body;
    if (event !== "charge.success") {
      return res.sendStatus(200);
    }

    const { reference } = data;

    // Pull the order WITH its items and the user — we need all of this
    // to know what to provision and who it belongs to
    const order = await prisma.order.findUnique({
      where: { paystackRef: reference },
      include: { items: { include: { plan: true } }, user: true },
    });

    if (!order) return res.sendStatus(200);
    if (order.status === "PAID") return res.sendStatus(200); // already processed

    // Mark the order paid FIRST — if anything below fails, we still know
    // the customer paid, and can retry provisioning manually rather than
    // accidentally charging them twice
    await prisma.order.update({
      where: { paystackRef: reference },
      data: { status: "PAID", paystackData: data },
    });

    // Resolve the domain name for a HOSTING item by looking for a DOMAIN
    // item in the same cart — so we can set the correct primary domain on
    // the cPanel account instead of the fallback subdomain.

    // Walk through every item in the cart and provision it according to its type

    await provisionOrderItems(order.id);

    // Sync to WHMCS for record-keeping
    if (order.user.whmcsClientId) {
      try {
        const description = order.items
          .map((i) =>
            i.type === "HOSTING"
              ? `Hosting: ${i.plan?.name ?? "Unknown Plan"}`
              : `${i.type}: ${i.domainName}`,
          )
          .join(", ");

        const invoice = await createWhmcsInvoice(
          order.user.whmcsClientId,
          order.amount,
          description,
          order.paystackRef,
        );
        await markWhmcsInvoicePaid(
          invoice.invoiceid,
          order.amount,
          order.paystackRef,
        );
      } catch (whmcsError) {
        console.error("WHMCS invoice sync failed:", whmcsError);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    return res.sendStatus(500);
  }
};

// GET /orders/verify/:reference (backup manual verify — called by the frontend
// after redirect from Paystack callback to confirm payment status)
// export const verifyPayment = async (req: AuthRequest, res: Response) => {
//   try {
//     const { reference } = req.params as { reference: string };

//     // 1. Check our DB first — include items so we can return meaningful data
//     const order = await prisma.order.findUnique({
//       where: { paystackRef: reference },
//       include: {
//         plan: true,
//         items: { include: { plan: true } },
//         user: true,
//       },
//     });

//     if (!order) {
//       return sendResp(res, HTTP_STATUS.NOT_FOUND, "Order not found");
//     }

//     // make sure order belongs to user
//     if (order.userId !== req.userId) {
//       return sendResp(res, HTTP_STATUS.FORBIDDEN, "Unauthorized");
//     }

//     // 2. If already paid in our DB, return immediately without re-hitting Paystack
//     if (order.status === "PAID") {
//       return sendResp(res, HTTP_STATUS.OK, "Payment verified", {
//         status: "PAID",
//         items: order.items,
//         amount: order.amount,
//         reference: order.paystackRef,
//       });
//     }

//     // 3. Double-check with Paystack for orders still marked PENDING
//     const paystackResponse = await paystackClient.get(
//       `/transaction/verify/${reference}`,
//     );

//     if (!paystackResponse.data.status) {
//       return sendResp(
//         res,
//         HTTP_STATUS.SERVER_ERROR,
//         "Failed to verify payment",
//       );
//     }

//     const paystackData = paystackResponse.data.data;

//     if (paystackData.status !== "success") {
//       return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Payment not successful", {
//         status: paystackData.status,
//       });
//     }

//     // 4. Update order — the webhook should have already done this, but this
//     //    acts as a reliable fallback if the webhook was delayed or missed.
//     //    Re-check status after update to avoid double WHMCS invoices.
//     const updated = await prisma.order.update({
//       where: { paystackRef: reference },
//       data: {
//         status: "PAID",
//         paystackData: paystackData,
//       },
//     });

//     // 5. WHMCS sync — only if this verify call is the one actually marking it paid
//     //    (i.e. it wasn't already PAID in DB — which we checked above via early return)
//     if (order.user.whmcsClientId) {
//       try {
//         const description = order.items
//           .map((i) =>
//             i.type === "HOSTING"
//               ? `Hosting: ${i.plan?.name ?? "Unknown Plan"}`
//               : `${i.type}: ${i.domainName}`,
//           )
//           .join(", ") || "Order";

//         const invoice = await createWhmcsInvoice(
//           order.user.whmcsClientId,
//           order.amount,
//           description,
//           order.paystackRef,
//         );
//         await markWhmcsInvoicePaid(
//           invoice.invoiceid,
//           order.amount,
//           order.paystackRef,
//         );
//       } catch (whmcsError) {
//         console.error("WHMCS invoice sync failed:", whmcsError);
//       }
//     }

//     return sendResp(res, HTTP_STATUS.OK, "Payment verified", {
//       status: "PAID",
//       items: order.items,
//       amount: order.amount,
//       reference: order.paystackRef,
//     });
//   } catch (error) {
//     return sendResp(
//       res,
//       HTTP_STATUS.SERVER_ERROR,
//       "Something went wrong verifying payment",
//       null,
//       error instanceof Error ? error.message : "Unknown error",
//     );
//   }
// };

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { reference } = req.params as { reference: string };

    const order = await prisma.order.findUnique({
      where: { paystackRef: reference },
      include: {
        plan: true,
        items: { include: { plan: true } },
        user: true,
      },
    });

    if (!order) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Order not found");
    }

    if (order.userId !== req.userId) {
      return sendResp(res, HTTP_STATUS.FORBIDDEN, "Unauthorized");
    }

    if (order.status === "PAID") {
      return sendResp(res, HTTP_STATUS.OK, "Payment verified", {
        status: "PAID",
        items: order.items,
        amount: order.amount,
        reference: order.paystackRef,
      });
    }

    const paystackResponse = await paystackClient.get(
      `/transaction/verify/${reference}`,
    );

    if (!paystackResponse.data.status) {
      return sendResp(
        res,
        HTTP_STATUS.SERVER_ERROR,
        "Failed to verify payment",
      );
    }

    const paystackData = paystackResponse.data.data;

    if (paystackData.status !== "success") {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Payment not successful", {
        status: paystackData.status,
      });
    }

    await prisma.order.update({
      where: { paystackRef: reference },
      data: {
        status: "PAID",
        paystackData: paystackData,
      },
    });

    // This was missing — without it, nothing ever actually got provisioned
    // when the webhook hadn't already done it first (e.g. local dev,
    // or a delayed webhook in production).
    await provisionOrderItems(order.id);

    if (order.user.whmcsClientId) {
      try {
        const description =
          order.items
            .map((i) =>
              i.type === "HOSTING"
                ? `Hosting: ${i.plan?.name ?? "Unknown Plan"}`
                : `${i.type}: ${i.domainName}`,
            )
            .join(", ") || "Order";

        const invoice = await createWhmcsInvoice(
          order.user.whmcsClientId,
          order.amount,
          description,
          order.paystackRef,
        );
        await markWhmcsInvoicePaid(
          invoice.invoiceid,
          order.amount,
          order.paystackRef,
        );
      } catch (whmcsError) {
        console.error("WHMCS invoice sync failed:", whmcsError);
      }
    }

    return sendResp(res, HTTP_STATUS.OK, "Payment verified", {
      status: "PAID",
      items: order.items,
      amount: order.amount,
      reference: order.paystackRef,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong verifying payment",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

// GET /orders → get user's orders with all cart items
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      include: {
        items: { include: { plan: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendResp(res, HTTP_STATUS.OK, "", orders);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting orders",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
