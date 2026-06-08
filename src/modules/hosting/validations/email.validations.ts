import z from "zod";

export const createEmailHostingSchema = z.object({
  email: z.string().min(1, "Email username is required")
    .regex(/^[a-zA-Z0-9._-]+$/, "Invalid email username — only letters, numbers, dots, hyphens and underscores allowed"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  quota: z.number().optional().default(250), // MB
});

export const createForwarderSchema = z.object({
  source: z.email("invalid email"),
  destination: z.string().email("Invalid destination email address"),
});