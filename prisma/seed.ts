import * as dotenv from "dotenv";
dotenv.config();

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const plans = [
  {
    name: "Starter",
    price: 30000,
    monthlyPrice: 3000,
    quarterlyPrice: 9500,
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
    monthlyPrice: 10000,
    quarterlyPrice: 28000,
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
    monthlyPrice: 24000,
    quarterlyPrice: 68000,
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
];

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log("✅ Plans upserted (existing plans updated, none deleted)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());