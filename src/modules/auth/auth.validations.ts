import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "Name is too short"),
  lastName: z.string().min(2, "Name is too short"),
  email: z.email("Invalid email"),
  phoneNumber: z.string().min(10, "Invalid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string(),
  address: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  postcode: z.string(),
});

export const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password must bee at least 6 characters"),
});

export const verifyOTPSchema = z.object({
  email: z.email("Invalid email"),
  code: z
    .string()
    .length(6)
    .min(6, {
      message: "Please enter all 6 digits of your code.",
    })
    .max(6, {
      message: "Code cannot be longer than 6 digits.",
    })
    .regex(/^[0-9]+$/, {
      message: "The confirmation code must only contain numbers.",
    }),
});

export const resendOTPSchema = z.object({
  email: z.email("Invalid email"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email"),
});

export const verifyResetPasswordOTPSchema = verifyOTPSchema.extend({});
