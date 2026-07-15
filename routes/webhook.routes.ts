import express, { Request, Response } from "express";
import Stripe from "stripe";
import { ObjectId } from "mongodb";

import { getCollections } from "../db";
import { calculateNextWatering } from "../utils/careSchedule";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

router.post("/stripe", express.raw({ type: "application/json" }) as express.RequestHandler, async (req: Request, res: Response): Promise<void> => {
   let event: Stripe.Event;

   try {
      event = stripe.webhooks.constructEvent(
         req.body as Buffer,
         req.headers["stripe-signature"] as string,
         process.env.STRIPE_WEBHOOK_SECRET!
      );
   } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Webhook signature verification failed:", message);
      res.status(400).send(`Webhook Error: ${message}`);
      return;
   }

   if (event.type === "checkout.session.completed") {
      try {
         const session = event.data.object as Stripe.Checkout.Session;
         const { orderCollection, plantCollection, careScheduleCollection } = getCollections();

         const userEmail = session.metadata?.userEmail;
         const items = JSON.parse(session.metadata?.items || "[]");

         const orderResult = await orderCollection.insertOne({
            userEmail,
            items,
            totalAmount: (session.amount_total || 0) / 100,
            status: "paid",
            stripeSessionId: session.id,
            createdAt: new Date(),
         });

         for (const item of items) {
            const plant = await plantCollection.findOne({ _id: new ObjectId(item.plantId) });
            if (!plant) continue;

            await plantCollection.updateOne({ _id: new ObjectId(item.plantId) }, { $inc: { stock: -Number(item.quantity) } });

            const frequencyDays = plant.watering?.frequencyDays || 7;
            const now = new Date();

            await careScheduleCollection.insertOne({
               userEmail,
               plantId: plant._id,
               orderId: orderResult.insertedId,
               plantTitle: plant.title,
               plantImage: (plant.images as string[])?.[0] || "",
               careTips: plant.careTips || {},
               wateringFrequencyDays: frequencyDays,
               lastWatered: now,
               nextWatering: calculateNextWatering(now, frequencyDays),
               quantity: item.quantity,
               createdAt: now,
            });
         }
      } catch (error) {
         console.error("Error processing checkout.session.completed:", error);
      }
   }

   res.json({ received: true });
});

export default router;
