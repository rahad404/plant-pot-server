import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { connectDB, client } from "./db";
import usersRoutes from "./routes/users.routes";
import plantsRoutes from "./routes/plants.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import adminOrdersRoutes from "./routes/admin.orders.routes";
import contactRoutes from "./routes/contact.routes";
import ordersRoutes from "./routes/orders.routes";

const app = express();
const port = process.env.PORT || 5000;

// Support multiple allowed origins via comma-separated CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Lazily connect to MongoDB on every request if not connected (for Vercel serverless / local resilience)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(error);
    }
});

app.get("/", (_req: Request, res: Response) => {
    res.send("Plant shop server is running!");
});

app.use("/api/users", usersRoutes);
app.use("/api/plants", plantsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/contact", contactRoutes);

app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});

// For local testing, listen on the port
if (process.env.VERCEL !== "1") {
    connectDB()
        .then(() => {
           app.listen(port, () => {
              console.log(`Plant shop server listening on port ${port}`);
           });
        })
        .catch((error: Error) => {
           console.error("Failed to connect to MongoDB:", error);
        });
}

process.on("SIGINT", async () => {
    if (client) await client.close();
    process.exit(0);
});

export default app;
