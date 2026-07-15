import express, { Request, Response } from "express";

import verifyToken from "../middleware/verifyToken";
import { getCollections } from "../db";

const router = express.Router();

router.get("/my-plants", verifyToken, async (req: Request, res: Response): Promise<void> => {
   try {
      const { careScheduleCollection } = getCollections();
      const myPlants = await careScheduleCollection.find({ userEmail: req.user!.email }).sort({ createdAt: -1 }).toArray();
      res.status(200).json(myPlants);
   } catch (error) {
      console.error("Error fetching dashboard plants:", error);
      res.status(500).json({ message: "Failed to fetch your plants." });
   }
});

router.get("/orders", verifyToken, async (req: Request, res: Response): Promise<void> => {
   try {
      const { orderCollection } = getCollections();
      const orders = await orderCollection.find({ userEmail: req.user!.email }).sort({ createdAt: -1 }).toArray();
      res.status(200).json(orders);
   } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch order history." });
   }
});

export default router;
