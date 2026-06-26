import { Router } from "express";

import { getSyncGaps, syncWhmcsUser } from "./whmcs.controller";
import { isAdmin } from "../../middleware/admin.middleware";


const router = Router();

router.get("/whmcs-sync-gaps", isAdmin, getSyncGaps);
router.post("/users/:userId/sync-whmcs", isAdmin, syncWhmcsUser);
// router.post("/orders/:orderId/reconcile", isAdmin, reconcileOrder);

export default router;