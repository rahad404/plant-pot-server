import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";

import verifyToken from "../middleware/verifyToken";
import { getCollections } from "../db";
import { calculateNextWatering } from "../utils/careSchedule";

const router = express.Router();

router.patch("/:id/watered", verifyToken, async (req: Request, res: Response): Promise<void> => {
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
      const nextWatering = calculateNextWatering(now, schedule.wateringFrequencyDays);

      await careScheduleCollection.updateOne({ _id: new ObjectId(id) }, { $set: { lastWatered: now, nextWatering } });

      res.status(200).json({ success: true, message: "Marked as watered.", nextWatering });
   } catch (error) {
      console.error("Error updating watering status:", error);
      res.status(500).json({ message: "Failed to update watering status." });
   }
});

export default router;
