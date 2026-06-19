import cron from "node-cron";
import { prisma } from "../lib/prisma";

export function startTokenCleanupJob() {
  // Runs once a day at 3:00 AM server time
  cron.schedule("0 3 * * *", async () => {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      console.log(`Cleaned up ${result.count} expired refresh tokens`);
    } catch (error) {
      console.error("Token cleanup job failed:", error);
    }
  });
}