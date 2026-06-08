import z from "zod";

export const provisionHostingSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
      "Invalid domain format",
    ),
});