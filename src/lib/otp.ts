import { prisma } from "./prisma";

export const generateOTP = () => {
  // 6 digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveOTP = async (userId: string, code: string) => {
  await prisma.oTP.deleteMany({ where: { userId } });

  return prisma.oTP.create({
    data: {
      userId,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });
};
