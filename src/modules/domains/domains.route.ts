import { Router } from "express";
import { getDomainById, getDomains, searchAvailableDomains } from "./domains.controller";
import { protect } from "../../middleware/auth.middleware";
import { createDNSRecord, deleteDNSRecord, getDNSRecords, updateDNSRecord } from "../hosting/stats/dns.controller";

const router = Router()

router.post("/domains/search", searchAvailableDomains)
router.get("/domains", protect, getDomains);
router.get("/domains/:id", protect, getDomainById);


router.get("/domains/:id/dns", protect, getDNSRecords);
router.post("/domains/:id/dns", protect, createDNSRecord);
router.patch("/domains/:id/dns/:recordId", protect, updateDNSRecord);
router.delete("/domains/:id/dns/:recordId", protect, deleteDNSRecord);

export default router