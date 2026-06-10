import { z } from "zod";

export const createDatabaseSchema = z.object({
  name: z.string()
    .min(1, "Database name is required")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores allowed")
    .max(47, "Database name too long"),
});

export const createDatabaseUserSchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores allowed")
    .max(47, "Username too long"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const assignUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  database: z.string().min(1, "Database is required"),
  privileges: z.enum(["ALL PRIVILEGES", "READ", "WRITE"]).default("ALL PRIVILEGES"),
});