import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";

import verifyToken from "../middleware/verifyToken";
import verifyAdmin from "../middleware/verifyAdmin";
import { getCollections } from "../db";

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
       const { orderCollection } = getCollections();
       const { page = "1", limit = "20", search } = req.query as Record<string, string | undefined>;

       const query: Record<string, unknown> = {};
       if (search?.trim()) {
          const safe = search.trim();
          query.$or = [
             { plantName: { $regex: safe, $options: "i" } },
             { userName: { $regex: safe, $options: "i" } },
             { userEmail: { $regex: safe, $options: "i" } },
          ];
       }

       const pageNum = Math.max(Number(page) || 1, 1);
       const limitNum = Math.min(Number(limit) || 20, 100);
       const skip = (pageNum - 1) * limitNum;

       const [orders, total] = await Promise.all([
          orderCollection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).toArray(),
          orderCollection.countDocuments(query),
       ]);

       const formattedOrders = orders.map((order) => ({
          _id: order._id.toString(),
          userId: order.userId?.toString() || "",
          userName: order.userName,
          userEmail: order.userEmail,
          plantId: order.plantId?.toString() || "",
          plantName: order.plantName,
          price: order.price,
          status: order.status,
          createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
       }));

       res.status(200).json({
          orders: formattedOrders,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1,
       });
    } catch (error) {
       console.error("Error fetching all orders:", error);
       res.status(500).json({ message: "Failed to fetch orders." });
    }
});

router.patch("/:id", verifyToken, verifyAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
       const { orderCollection } = getCollections();
       const id = req.params.id as string;
       if (!ObjectId.isValid(id)) {
          res.status(400).json({ message: "Invalid Order ID" });
          return;
       }

       const { status } = req.body as { status: string };
       const allowed = ["paid", "processing", "shipped", "delivered", "cancelled"];
       if (!allowed.includes(status)) {
          res.status(400).json({ message: "Invalid order status." });
          return;
       }

       const result = await orderCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
       if (result.matchedCount === 0) {
          res.status(404).json({ message: "Order not found." });
          return;
       }

       res.status(200).json({ success: true, message: `Order marked as ${status}.` });
    } catch (error) {
       console.error("Error updating order status:", error);
       res.status(500).json({ message: "Failed to update order status." });
    }
});

export default router;
