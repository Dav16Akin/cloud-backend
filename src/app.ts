import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./lib/swagger";
const morgan: any = require("morgan");

import authRoutes from "./modules/auth/auth.route";
import userRoutes from "./modules/users/user.route";
import planRoutes from "./modules/plans/plans.route";
import hostingRoutes from "./modules/hosting/hosting.route";

const app = express();

app.use(morgan("dev"));

app.use(
  cors({
    origin: "http://localhost:3000", // your frontend URL
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api", hostingRoutes);

export default app;
