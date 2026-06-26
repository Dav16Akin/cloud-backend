import { Router } from "express";

import { getSyncGaps, reconcileOrder, syncWhmcsUser } from "./whmcs.controller";
import { requireAdmin } from "../../middleware/admin.middleware";
import { protect } from "../../middleware/auth.middleware";


const router = Router();

router.get("/whmcs-sync-gaps",protect, requireAdmin, getSyncGaps);
router.post("/:userId/sync-whmcs",protect, requireAdmin, syncWhmcsUser);
router.post("/reconcile-order/:orderId", protect, requireAdmin, reconcileOrder);

export default router;