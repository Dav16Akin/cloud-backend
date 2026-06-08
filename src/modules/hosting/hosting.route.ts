import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import {
  getHostingById,
  getHostings,
  getStats,
  provisionHosting,
} from "./controllers/account.controller";
import {
  changeHostingEmailPassword,
  createHostingEmail,
  createHostingEmailForwarder,
  deleteHostingEmail,
  deleteHostingEmailForwarder,
  getHostingEmailForwarders,
  getHostingEmails,
} from "./stats/email.controller";

const router = Router();
/**
 * @swagger
 * /api/hosting:
 *   get:
 *     summary: Get all hosting accounts for the authenticated user
 *     tags: [Hosting]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hosting accounts returned successfully
 *       404:
 *         description: No hosting accounts found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get("/hosting", protect, getHostings);

/**
 * @swagger
 * /api/hosting/{id}:
 *   get:
 *     summary: Get a hosting account by id
 *     tags: [Hosting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hosting account id
 *     responses:
 *       200:
 *         description: Hosting account returned successfully
 *       404:
 *         description: Hosting not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get("/hosting/:id", protect, getHostingById);

/**
 * @swagger
 * /api/hosting:
 *   post:
 *     summary: Provision a new hosting account
 *     tags: [Hosting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - domain
 *             properties:
 *               planId:
 *                 type: string
 *               domain:
 *                 type: string
 *                 example: example.com
 *     responses:
 *       201:
 *         description: Hosting account created
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Plan or user not found
 *       409:
 *         description: Domain is already in use
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.post("/hosting", protect, provisionHosting);

router.get("/hosting/:id/stats", protect, getStats);

router.get(
  "/hosting/:id/emails/forwarders",
  protect,
  getHostingEmailForwarders,
);

router.post(
  "/hosting/:id/emails/forwarders",
  protect,
  createHostingEmailForwarder,
);

router.delete(
  "/hosting/:id/emails/forwarders",
  protect,
  deleteHostingEmailForwarder,
);

router.get("/hosting/:id/emails", protect, getHostingEmails);

router.post("/hosting/:id/emails", protect, createHostingEmail);

router.delete("/hosting/:id/emails/:email", protect, deleteHostingEmail);

router.patch(
  "/hosting/:id/emails/:email/password",
  protect,
  changeHostingEmailPassword,
);

export default router;
