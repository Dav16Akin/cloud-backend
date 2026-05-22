import { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.validations";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { sendResp } from "../../utils/resp";
import { HTTP_STATUS } from "../../utils/statusCodes";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";
import { AuthRequest } from "../../middleware/auth.middleware";
import { toSafeUser } from "../../utils/safeuser";
import { generateOTP, saveOTP } from "../../lib/otp";
import { sendOTPEmail } from "../../lib/sendOTPEmail";

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

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      companyName,
      address,
      country,
      city,
      postcode,
    } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendResp(res, HTTP_STATUS.CONFLICT, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword,

        companyName,
        address,
        country,
        city,
        postcode,
      },
    });

    console.log("📨 Attempting to send OTP to:", user.email);
    const code = generateOTP();
    await saveOTP(user.id, code);
    await sendOTPEmail(user.email, code);
    console.log("✅ OTP send function completed");

    return sendResp(
      res,
      HTTP_STATUS.CREATED,
      "Account created. Check your email for a verification code.",
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

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "user does not exists",
        null,
      );
    }

    const safeUser = toSafeUser(user);

    return sendResp(res, HTTP_STATUS.OK, "", safeUser);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting user",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid input",
        null,
        parsed.error.issues.map((error) => error.message),
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "User not found", null);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid credentials",
        null,
      );
    }

    if (isMatch) {
      const accessToken = generateAccessToken(user.id);

      const refreshToken = generateRefreshToken(user.id);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // JS cannot access this
        secure: true, // HTTPS only
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.status(200).json({
        accessToken,
      });
    }
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong login user",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;

    await prisma.refreshToken.delete({ where: { token } });

    res.clearCookie("refreshToken");
    return sendResp(res, HTTP_STATUS.OK, "Logged out");
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong login user",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return sendResp(res, HTTP_STATUS.UNAUTHORIZED, "No refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored) {
    return sendResp(res, HTTP_STATUS.UNAUTHORIZED, "Invalid refresh token");
  }

  const payload = verifyRefreshToken(token);
  if (!payload) {
    return sendResp(res, HTTP_STATUS.UNAUTHORIZED, "Expired or tampered");
  }

  const newAccessToken = generateAccessToken(payload.userId);

  return sendResp(res, HTTP_STATUS.OK, "", { accessToken: newAccessToken });
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Email and code are required",
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "User not found");
    }

    if (user.verified) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "User already verified");
    }

    const otp = await prisma.oTP.findFirst({
      where: { userId: user.id, code },
    });

    if (!otp) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Invalid code");
    }

    if (otp.expiresAt < new Date()) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Code has expired");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { verified: true },
      }),
      prisma.oTP.deleteMany({ where: { userId: user.id } }),
    ]);

    return sendResp(res, HTTP_STATUS.OK, "Email verified successfully");
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong verifying OTP",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
