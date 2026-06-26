import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthRequest } from "../../middleware/auth.middleware";
import { sendResp } from "../../utils/resp";
import { HTTP_STATUS } from "../../utils/statusCodes";
import {
  createWhmcsInvoice,
  ensureWhmcsClient,
  markWhmcsInvoicePaid,
} from "../../lib/whmcs";

export const getSyncGaps = async (req: AuthRequest, res: Response) => {
  try {
    const usersWithoutClient = await prisma.user.findMany({
      where: { whmcsClientId: null },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    const ordersWithoutInvoice = await prisma.order.findMany({
      where: {
        status: "PAID",
        whmcsInvoiceId: null, // you'll need to add this column
      },
      include: { user: true, items: { include: { plan: true } } },
    });

    return sendResp(res, HTTP_STATUS.OK, "Sync gaps fetched", {
      users: usersWithoutClient,
      orders: ordersWithoutInvoice,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Failed to fetch sync gaps",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const syncWhmcsUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "User not found");
    }

    if (user.whmcsClientId) {
      return sendResp(res, HTTP_STATUS.OK, "User already has a whmcs id", {
        whmcsClientId: user.whmcsClientId,
      });
    }

    const clientId = await ensureWhmcsClient(user);
    return sendResp(res, HTTP_STATUS.OK, "WHMCS client created", {
      whmcsClientId: clientId,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Failed to sync user with WHMCS",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const reconcileOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params as { orderId: string };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: { include: { plan: true } } },
    });

    if (!order) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Order not found");
    }

    if (order.status !== "PAID") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Only paid orders can be reconciled with WHMCS",
      );
    }

    const clientId = await ensureWhmcsClient(order.user);

    let invoiceId = order.whmcsInvoiceId;

    if (!invoiceId) {
      const description =
        order.items
          .map((i) =>
            i.type === "HOSTING"
              ? `Hosting: ${i.plan?.name ?? "Unknown Plan"}`
              : `${i.type}: ${i.domainName}`,
          )
          .join(", ") || "Order";

      const invoice = await createWhmcsInvoice(
        clientId,
        order.amount,
        description,
        order.paystackRef,
      );

      if (!invoice.invoiceid) {
        throw new Error("WHMCS did not return an invoice ID");
      }

      invoiceId = invoice.invoiceid;

      await markWhmcsInvoicePaid(invoiceId as number, order.amount, order.paystackRef);

      // Persist it — this is what was missing. Without this, every
      // re-run of reconcileOrder would create a brand new duplicate
      // invoice instead of recognizing this one's already synced.
      await prisma.order.update({
        where: { id: order.id },
        data: { whmcsInvoiceId: invoiceId },
      });
    }

    return sendResp(res, HTTP_STATUS.OK, "Order reconciled with WHMCS", {
      whmcsClientId: clientId,
      whmcsInvoiceId: invoiceId,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Failed to reconcile order",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
