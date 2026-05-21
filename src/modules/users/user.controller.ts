import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { sendResp } from "../../utils/resp";
import { HTTP_STATUS } from "../../utils/statusCodes";
import { prisma } from "../../lib/prisma";
import { toSafeUser } from "../../utils/safeuser";
import bcrypt from "bcryptjs";
import { changePasswordSchema, updateUserSchema } from "./user.validations";

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "User not found", null);
    }

    const safeUser = toSafeUser(user);
    return sendResp(res, HTTP_STATUS.OK, "", safeUser);
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Error getting user");
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid credentials",
        null,
        parsed.error.issues.map((error) => error.message),
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(parsed.data.firstName && { firstName: parsed.data.firstName }),
        ...(parsed.data.lastName && { lastName: parsed.data.lastName }),
        ...(parsed.data.address && { address: parsed.data.address }),
        ...(parsed.data.country && { country: parsed.data.country }),
        ...(parsed.data.city && { city: parsed.data.city }),
        ...(parsed.data.postcode && { postcode: parsed.data.postcode }),
      },
    });

    if (!updatedUser) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "User not found", null);
    }

    return sendResp(
      res,
      HTTP_STATUS.OK,
      "User updated",
      toSafeUser(updatedUser),
    );
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong while updating user",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid credentials",
        null,
        parsed.error.issues.map((error) => error.message),
      );
    }

    const { oldPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "User not found", null);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Old password is incorrect",
        null,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.userId },
        data: { password: hashedPassword },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: req.userId } }),
    ]);

    return sendResp(res, HTTP_STATUS.OK, "Password changed successfully", null);
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong while changing user password",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const deletedUser = await prisma.user.delete({ where: { id: req.userId } });

    if (!deletedUser) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "User not found", null);
    }

    return sendResp(res, HTTP_STATUS.NO_CONTENT, "User deleted", {
      id: deletedUser.id,
      email: deletedUser.email,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong while deleting user",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
