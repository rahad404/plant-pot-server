import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";

import verifyToken from "../middleware/verifyToken";
import { getCollections } from "../db";
import { calculateNextWatering } from "../utils/careSchedule";

const router = express.Router();

router.get("/my-plants", verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
       const { careScheduleCollection } = getCollections();
       const myPlants = await careScheduleCollection.find({ userEmail: req.user!.email }).sort({ createdAt: -1 }).toArray();
       
       const formattedPlants = myPlants.map((plant) => ({
          _id: plant._id.toString(),
          userId: plant.userId?.toString() || "",
          plantId: plant.plantId?.toString() || "",
          plantName: plant.plantName,
          orderId: plant.orderId,
          lastWatered: plant.lastWatered?.toISOString() || null,
          nextWatering: plant.nextWatering?.toISOString() || null,
          createdAt: plant.createdAt?.toISOString() || new Date().toISOString(),
          light: plant.light || "",
          watering: plant.watering || "",
          compost: plant.compost || "",
          medicine: plant.medicine || "",
          image: plant.image || "",
          wateringFrequencyDays: plant.wateringFrequencyDays || 7,
       }));

       res.status(200).json({ plants: formattedPlants });
    } catch (error) {
       console.error("Error fetching dashboard plants:", error);
       res.status(500).json({ message: "Failed to fetch your plants." });
    }
});

router.get("/orders", verifyToken, async (req: Request, res: Response): Promise<void> => {
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

router.patch("/care-schedule/:id/watered", verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
       const { careScheduleCollection } = getCollections();
       const id = req.params.id as string;
       if (!ObjectId.isValid(id)) {
          res.status(400).json({ message: "Invalid schedule ID" });
          return;
       }

       const schedule = await careScheduleCollection.findOne({ _id: new ObjectId(id) });
       if (!schedule) {
          res.status(404).json({ message: "Care schedule not found." });
          return;
       }
       if (schedule.userEmail !== req.user!.email) {
          res.status(403).json({ message: "forbidden access" });
          return;
       }

       const now = new Date();
       const nextWatering = calculateNextWatering(now, schedule.wateringFrequencyDays || 7);

       await careScheduleCollection.updateOne({ _id: new ObjectId(id) }, { $set: { lastWatered: now, nextWatering } });

       res.status(200).json({ success: true, message: "Marked as watered.", nextWatering });
    } catch (error) {
       console.error("Error updating watering status:", error);
       res.status(500).json({ message: "Failed to update watering status." });
    }
});

export default router;
