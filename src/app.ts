import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const morgan: any = require("morgan");

import authRoutes from "./modules/auth/auth.route";
import userRoutes from "./modules/users/user.route";
import planRoutes from "./modules/plans/plans.route";
import hostingRoutes from "./modules/hosting/hosting.route";
import orderRoutes from "./modules/orders/order.route";
import domainRoutes from "./modules/domains/domains.route"
import billingRoutes from "./modules/billing/billing.routes"
import { startTokenCleanupJob } from "./jobs/cleanupExpiredTokens";

const app = express();

app.use(morgan("dev"));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://www.nupatcloud.com",
    ], // your frontend URL
    credentials: true,
  }),
);

app.use(
  "/api/orders/webhook",
  express.raw({ type: "application/json" }),
  (req: any, res, next) => {
    req.body = JSON.parse(req.body);
    next();
  },
);

app.use(express.json());
app.use(cookieParser());

startTokenCleanupJob();

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api", hostingRoutes);
app.use("/api", orderRoutes);
app.use("/api", domainRoutes)
app.use('/api/billing', billingRoutes);

export default app;
