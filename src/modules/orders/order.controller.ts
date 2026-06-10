import crypto from "crypto";
import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { sendResp } from "../../utils/resp";
import { HTTP_STATUS } from "../../utils/statusCodes";
import { prisma } from "../../lib/prisma";
import paystackClient from "../../lib/paystack";
import { initializePaymentSchema } from "./order.validation";

// POST /orders/initialize
export const initializePayment = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = initializePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Invalid input", null,
        parsed.error.issues.map((e) => e.message));
    }

    const { planId } = parsed.data;

    // 1. Get plan
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Plan not found");

    // 2. Get user
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return sendResp(res, HTTP_STATUS.NOT_FOUND, "User not found");

    // 3. Check if user already has an active order for this plan
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId: req.userId!,
        planId,
        status: "PAID",
      },
    });

    if (existingOrder) {
      return sendResp(res, HTTP_STATUS.CONFLICT,
        "You already have an active order for this plan");
    }

    // 4. Initialize Paystack payment
    // Paystack amount is in kobo (multiply by 100)
    const paystackResponse = await paystackClient.post("/transaction/initialize", {
      email: user.email,
      amount: plan.price * 100,
      currency: "NGN",
      callback_url: `${process.env.FRONTEND_URL}/dashboard/orders/verify`,
      metadata: {
        planId: plan.id,
        planName: plan.name,
        userId: user.id,
      },
    });

    if (!paystackResponse.data.status) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Failed to initialize payment");
    }

    const { reference, authorization_url } = paystackResponse.data.data;

    // 5. Save pending order to DB
    await prisma.order.create({
      data: {
        userId: req.userId!,
        planId: plan.id,
        amount: plan.price,
        status: "PENDING",
        paystackRef: reference,
      },
    });

    // 6. Return payment URL to frontend
    return sendResp(res, HTTP_STATUS.OK, "Payment initialized", {
      paymentUrl: authorization_url,
      reference,
    });
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR,
      "Something went wrong initializing payment",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// POST /orders/webhook (no auth - called by Paystack)
export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    // 1. Verify webhook signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    const { event, data } = req.body;

    // 2. Only handle successful charges
    if (event !== "charge.success") {
      return res.sendStatus(200); // acknowledge other events
    }

    const { reference, metadata } = data;

    // 3. Find the order
    const order = await prisma.order.findUnique({
      where: { paystackRef: reference },
    });

    if (!order) {
      return res.sendStatus(200); // order not found, ignore
    }

    if (order.status === "PAID") {
      return res.sendStatus(200); // already processed, ignore
    }

    // 4. Update order to PAID
    await prisma.order.update({
      where: { paystackRef: reference },
      data: {
        status: "PAID",
        paystackData: data,
      },
    });

    // 5. Acknowledge webhook immediately
    // Paystack expects a 200 response within 5 seconds
    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    return res.sendStatus(500);
  }
};

// GET /orders/verify/:reference (backup manual verify)
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { reference } = req.params as { reference: string };

    // 1. Check our DB first
    const order = await prisma.order.findUnique({
      where: { paystackRef: reference },
      include: { plan: true },
    });

    if (!order) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Order not found");
    }

    // make sure order belongs to user
    if (order.userId !== req.userId) {
      return sendResp(res, HTTP_STATUS.FORBIDDEN, "Unauthorized");
    }

    // 2. If already paid in our DB return it
    if (order.status === "PAID") {
      return sendResp(res, HTTP_STATUS.OK, "Payment verified", {
        status: "PAID",
        plan: order.plan,
        amount: order.amount,
        reference: order.paystackRef,
      });
    }

    // 3. Double check with Paystack
    const paystackResponse = await paystackClient.get(
      `/transaction/verify/${reference}`
    );

    if (!paystackResponse.data.status) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Failed to verify payment");
    }

    const paystackData = paystackResponse.data.data;

    if (paystackData.status !== "success") {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Payment not successful", {
        status: paystackData.status,
      });
    }

    // 4. Update order if Paystack confirms payment
    await prisma.order.update({
      where: { paystackRef: reference },
      data: {
        status: "PAID",
        paystackData: paystackData,
      },
    });

    return sendResp(res, HTTP_STATUS.OK, "Payment verified", {
      status: "PAID",
      plan: order.plan,
      amount: order.amount,
      reference: order.paystackRef,
    });
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR,
      "Something went wrong verifying payment",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// GET /orders → get user's orders
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return sendResp(res, HTTP_STATUS.OK, "", orders);
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting orders",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};