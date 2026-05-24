import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const morgan: any = require("morgan");

import authRoutes from "./modules/auth/auth.route";
import userRoutes from "./modules/users/user.route";

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

export default app;
