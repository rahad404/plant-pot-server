import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";

import verifyToken from "../middleware/verifyToken";
import { getCollections } from "../db";
import { calculateNextWatering } from "../utils/careSchedule";

const router = express.Router();

router.post("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
       const { orderCollection, careScheduleCollection, plantCollection } = getCollections();
       const { plantId, plantName, price } = req.body;

       if (!plantId || !plantName || price === undefined) {
          res.status(400).json({ error: "Missing required fields" });
          return;
       }

       const plant = await plantCollection.findOne({ _id: new ObjectId(plantId) });
       if (!plant) {
          res.status(404).json({ error: "Plant not found" });
          return;
       }

       const order = {
          userId: new ObjectId(req.user!.sub as string),
          userName: req.user!.name,
          userEmail: req.user!.email,
          plantId: new ObjectId(plantId),
          plantName,
          price: parseFloat(price),
          status: "paid",
          createdAt: new Date(),
       };

       const result = await orderCollection.insertOne(order);

       await careScheduleCollection.insertOne({
          userId: new ObjectId(req.user!.sub as string),
          userEmail: req.user!.email,
          plantId: new ObjectId(plantId),
          plantName,
          orderId: result.insertedId.toString(),
          lastWatered: null,
          nextWatering: calculateNextWatering(new Date(), 7),
          createdAt: new Date(),
          light: plant.light || "",
          watering: plant.watering?.amount || "",
          compost: plant.careTips?.compost || "",
          medicine: plant.careTips?.medicine || "",
          image: plant.images?.[0] || "",
          wateringFrequencyDays: 7,
       });

       res.status(201).json({ order: { ...order, _id: result.insertedId.toString() } });
    } catch (error) {
       console.error("Error creating order:", error);
       res.status(500).json({ error: "Failed to create order" });
    }
});

router.get("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
       const { orderCollection } = getCollections();
       const orders = await orderCollection.find({ userEmail: req.user!.email }).sort({ createdAt: -1 }).toArray();

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

       res.status(200).json({ orders: formattedOrders });
    } catch (error) {
       console.error("Error fetching orders:", error);
       res.status(500).json({ message: "Failed to fetch order history." });
    }
});

export default router;