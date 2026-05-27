import z from "zod";

export const userSchema = z.object({
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

export const updateUserSchema = z.object({
  firstName: z.string().min(2, "Name is too short").optional(),
  lastName: z.string().min(2, "Name is too short").optional(),
  //   email: z.email("Invalid email"),
  phoneNumber: z.string().min(10, "Invalid phone number"),
  companyName: z.string(),
  address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, "Password must bee at least 6 characters"),
  newPassword: z.string().min(6, "Password must bee at least 6 characters"),
});
