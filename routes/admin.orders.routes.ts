import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";

import verifyToken from "../middleware/verifyToken";
import verifyAdmin from "../middleware/verifyAdmin";
import { getCollections } from "../db";

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, async (req: Request, res: Response): Promise<void> => {
   try {
      const { orderCollection } = getCollections();
      const orders = await orderCollection.find().sort({ createdAt: -1 }).toArray();
      res.status(200).json(orders);
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
