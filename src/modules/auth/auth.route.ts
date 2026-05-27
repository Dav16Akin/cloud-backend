import { Router } from "express";
import {
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  register,
  resendOTP,
  resetPassword,
  verifyOTP,
  verifyResetPasswordOTP,
} from "./auth.controller";

import { protect } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.post("/refresh", refresh);

router.post("/verify", verifyOTP);

router.post("/resend", resendOTP);

router.post("/forgot-password", forgotPassword);

router.post("/verify-reset-otp", verifyResetPasswordOTP);

router.post("/reset-password", resetPassword);

router.get("/me", protect, getMe);

export default router;
