import { Request, Response } from "express";
import { registerSchema } from "./auth.validations";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { sendResp } from "../../utils/resp";
import { HTTP_STATUS } from "../../utils/statusCodes";

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid input",
        null,
        parsed.error.issues.map((error) => error.message),
      );
    }

    const { fullName, email, phoneNumber, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendResp(res, HTTP_STATUS.CONFLICT, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phoneNumber,
        password: hashedPassword,
      },
    });

    const safeUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      verified: user.verified,
      createdAt: user.createdAt,
    };

    return sendResp(
      res,
      HTTP_STATUS.CREATED,
      "User created successfully",
      safeUser,
    );
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong registering user",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
