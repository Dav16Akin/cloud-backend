import { Router } from "express";
import { getPlan, getPlans } from "./plans.controller";

const router = Router();

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Get all active plans
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: Plans returned successfully
 *       500:
 *         description: Server error
 */

router.get("/", getPlans);

/**
 * @swagger
 * /api/plans/{id}:
 *   get:
 *     summary: Get a plan by id
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan id
 *     responses:
 *       200:
 *         description: Plan returned successfully
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */

router.get("/:id", getPlan);

export default router;
