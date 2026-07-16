import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { connectDB } from "./db";

import authRoutes from "./routes/auth";
import plantRoutes from "./routes/plants";
import orderRoutes from "./routes/orders";
import adminOrderRoutes from "./routes/adminOrders";
import careScheduleRoutes from "./routes/careSchedule";
import contactRoutes from "./routes/contact";
import dashboardRoutes from "./routes/dashboard";
import userRoutes from "./routes/users";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
   .split(",")
   .map((origin) => origin.trim())
   .filter(Boolean);

app.use(
   cors({
      origin: (origin, callback) => {
         // allow non-browser tools (curl, Postman, server-to-server) which send no origin
         if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
         } else {
            callback(new Error("Not allowed by CORS"));
         }
      },
      credentials: true,
   })
);
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
   res.status(200).json({ message: "🌿 Plant Shop API is running" });
});

app.get("/health", (_req: Request, res: Response) => {
   res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/care-schedule", careScheduleRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

app.use((_req: Request, res: Response) => {
   res.status(404).json({ message: "Route not found" });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
   console.error("Unhandled error:", err.message);
   res.status(500).json({ message: "Internal server error" });
});

const start = async (): Promise<void> => {
   try {
      await connectDB();
      app.listen(PORT, () => {
         console.log(`🚀 Server running on port ${PORT}`);
      });
   } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
   }
};

start();
