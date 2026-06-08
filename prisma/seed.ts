import * as dotenv from "dotenv";
dotenv.config();

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // clear existing plans first
  await prisma.plan.deleteMany();

  await prisma.plan.createMany({
    data: [
      {
        name: "Starter",
        price: 30000,
        billingCycle: "yearly",
        storage: "2GB SSD",
        bandwidth: "10GB",
        websites: 1,
        emails: 2,
        isPopular: false,
        features: [
          "Free SSL Certificate",
          "Daily Backups",
          "cPanel Access",
          "24/7 Monitoring",
        ],
      },
      {
        name: "Business",
        price: 100000,
        billingCycle: "yearly",
        storage: "10GB SSD",
        bandwidth: "50GB",
        websites: 5,
        emails: 10,
        isPopular: true,
        features: [
          "Free SSL Certificate",
          "Daily Backups",
          "Priority Support",
          "Enhanced Performance",
        ],
      },
      {
        name: "Agency",
        price: 250000,
        billingCycle: "yearly",
        storage: "50GB SSD",
        bandwidth: "Unlimited",
        websites: 999,
        emails: 999,
        isPopular: false,
        features: [
          "White-label Support",
          "Dedicated Resources",
          "Advanced Security",
          "Priority Infrastructure",
        ],
      },
    ],
  });

  console.log("✅ Plans seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
