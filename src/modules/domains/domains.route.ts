import { Router } from "express";
import { getDomainById, getDomains, searchAvailableDomains } from "./domains.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router()

router.post("/domains/search", searchAvailableDomains)
router.get("/domains", protect, getDomains);
router.get("/domains/:id", protect, getDomainById);

export default router