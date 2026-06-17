import { Router } from "express";
import { getPlan, getPlans } from "./plans.controller";

const router = Router();

router.get("/", getPlans);

router.get("/:id", getPlan);

export default router;
