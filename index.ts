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

["MONGODB_URI", "CLIENT_URL"].forEach((key) => {
    if (!process.env[key]) {
       console.error(`Missing required env var: ${key}`);
       process.exit(1);
    }
});

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

connectDB()
    .then(() => {
       app.listen(port, () => {
          console.log(`Plant shop server listening on port ${port}`);
       });
    })
    .catch((error: Error) => {
       console.error("Failed to connect to MongoDB:", error);
       process.exit(1);
    });

process.on("SIGINT", async () => {
    if (client) await client.close();
    process.exit(0);
});

export default app;
