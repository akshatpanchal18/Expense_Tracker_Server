import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
const app = express();
const allowedOrigins = [
  "http://localhost:8081", // native frontend
  process.env.FRONTEND_URL, // production frontend
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true, // allow cookies (needed for auth)
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

import authRoutes from "./routes/auth.route.js";
import sharedRoutes from "./routes/shared.route.js";
import userRoutes from "./routes/user.route.js";
import expenseRoutes from "./routes/expense.route.js";
app.get("/awake", async (_req, res) => {
  try {
    await mongoose.connection.db?.command({ ping: 1 });

    res.json({
      success: true,
      message: "Backend is running",
    });
  } catch (error) {
    console.error("Awake check failed:", error);

    res.status(503).json({
      success: false,
      message: "Backend or database is unavailable",
    });
  }
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/shared", sharedRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/expense", expenseRoutes);

export default app;
