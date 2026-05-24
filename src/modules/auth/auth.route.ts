import { Router } from "express";
import {
  getMe,
  login,
  logout,
  refresh,
  register,
  resendOTP,
  verifyOTP,
} from "./auth.controller";

import { protect } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.post("/refresh", refresh);

router.post("/verify", verifyOTP);

router.post("/resend", resendOTP);

router.get("/me", protect, getMe);

export default router;
