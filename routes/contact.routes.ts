import express, { Request, Response } from "express";

import { getCollections } from "../db";

const router = express.Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
   try {
      const { contactCollection } = getCollections();
      const { name, email, message } = req.body;

      if (!name?.trim() || !email?.trim() || !message?.trim()) {
         res.status(400).json({ message: "Name, email and message are required." });
         return;
      }

      await contactCollection.insertOne({ name, email, message, createdAt: new Date() });
      res.status(201).json({ success: true, message: "Message received. We'll get back to you soon." });
   } catch (error) {
      console.error("Error saving contact message:", error);
      res.status(500).json({ message: "Failed to send message." });
   }
});

export default router;
