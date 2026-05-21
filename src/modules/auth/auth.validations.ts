import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "Name is too short"),
  lastName: z.string().min(2, "Name is too short"),
  email: z.email("Invalid email"),
  phoneNumber: z.string().min(10, "Invalid phone number"),
  password: z.string().min(6, "Password must bee at least 6 characters"),
  companyName: z.string(),
  address: z.string(),
  country: z.string(),
  city: z.string(),
  postcode: z.string(),
});

export const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password must bee at least 6 characters"),
});
