import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import {
  deleteHostingById,
  getHostingById,
  getHostings,
  getStats,
  provisionHosting,
  suspendHosting,
  unsuspendHosting,
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
import { assignUserToDatabase, createDatabase, createDatabaseUser, deleteDatabase, deleteDatabaseUser, getDatabases, getDatabaseUsers } from "./stats/database.controller";
import { createDNSRecord, deleteDNSRecord, getDNSRecords, updateDNSRecord } from "./stats/dns.controller";

const router = Router();

router.get("/hosting", protect, getHostings);

router.get("/hosting/:id", protect, getHostingById);

router.delete("/hosting/:id", protect, deleteHostingById)

router.post("/hosting/:id/suspend", protect, suspendHosting)

router.post("/hosting/:id/unsuspend", protect, unsuspendHosting)

router.post("/hosting", protect, provisionHosting);

router.get("/hosting/:id/stats", protect, getStats);



//EMAILS

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


//DATAASES
// specific routes first
router.get("/hosting/:id/databases/users", protect, getDatabaseUsers);
router.post("/hosting/:id/databases/users", protect, createDatabaseUser);
router.post("/hosting/:id/databases/users/assign", protect, assignUserToDatabase);
router.delete("/hosting/:id/databases/users/:user", protect, deleteDatabaseUser);

// dynamic routes after
router.get("/hosting/:id/databases", protect, getDatabases);
router.post("/hosting/:id/databases", protect, createDatabase);
router.delete("/hosting/:id/databases/:database", protect, deleteDatabase);


router.get("/hosting/:id/dns", protect, getDNSRecords);
router.post("/hosting/:id/dns", protect, createDNSRecord);
router.patch("/hosting/:id/dns/:recordId", protect, updateDNSRecord);
router.delete("/hosting/:id/dns/:recordId", protect, deleteDNSRecord);

export default router;
