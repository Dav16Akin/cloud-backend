import { Router } from "express";
import {
  initializePayment,
  paystackWebhook,
  verifyPayment,
  getOrders,
} from "./order.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();

// webhook must be before protect middleware
// and needs raw body for signature verification
router.post("/orders/webhook", paystackWebhook);

router.post("/orders/initialize", protect, initializePayment);
router.get("/orders/verify/:reference", protect, verifyPayment);
router.get("/orders", protect, getOrders);

export default router;