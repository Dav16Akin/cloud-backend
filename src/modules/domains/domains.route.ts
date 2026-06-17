import { Router } from "express";
import { openproviderRequest } from "../../lib/openProvider";
import { searchAvailableDomains } from "./domains.controller";

const router = Router()

router.post("/domains/search", searchAvailableDomains)

export default router