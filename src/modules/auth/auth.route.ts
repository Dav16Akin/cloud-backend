import { Router } from "express";
import { getMe, login, register } from "./auth.controller";

import { protect } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, getMe);

export default router;
