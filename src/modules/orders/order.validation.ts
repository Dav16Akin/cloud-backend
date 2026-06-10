import { z } from "zod";

export const initializePaymentSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
});