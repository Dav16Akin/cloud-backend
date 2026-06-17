import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import {
  changePassword,
  deleteUser,
  getUser,
  updateUser,
} from "./user.controller";

const router = Router();

router.get("/me", protect, getUser);

router.patch("/me", protect, updateUser);

router.patch("/change-password", protect, changePassword);

router.delete("/me", protect, deleteUser);

export default router;
