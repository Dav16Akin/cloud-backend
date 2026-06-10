import { z } from "zod";

export const createDNSRecordSchema = z.object({
  name: z.string().min(1, "Record name is required"),
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"]),
  address: z.string().min(1, "Address is required"),
  ttl: z.number().default(14400),
  priority: z.number().optional(), // only for MX records
});

export const updateDNSRecordSchema = z.object({
  line: z.number().min(1, "Record line number is required"),
  name: z.string().min(1, "Record name is required"),
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"]),
  address: z.string().min(1, "Address is required"),
  ttl: z.number().default(14400),
  priority: z.number().optional(),
});