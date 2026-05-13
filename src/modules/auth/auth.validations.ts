import {z} from "zod"

export const registerSchema = z.object({
    fullName: z.string().min(2, "Name is too short"),
    email: z.email("Invalid email"),
    phoneNumber: z.string().min(10, "Invalid phone number"),
    password: z.string().min(6, "Password must bee at least 6 characters")
})