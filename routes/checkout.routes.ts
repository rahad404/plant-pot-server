import express, { Request, Response } from "express";
import Stripe from "stripe";
import { ObjectId } from "mongodb";

import verifyToken from "../middleware/verifyToken";
import { getCollections } from "../db";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

interface CheckoutItem {
   plantId: string;
   quantity: number;
}

interface MetaItem {
   plantId: string;
   title: string;
   price: number;
   quantity: number;
}

router.post("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
   try {
      const { plantCollection } = getCollections();
      const { items }: { items: CheckoutItem[] } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
         res.status(400).json({ message: "No items provided for checkout." });
         return;
      }

      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      const metaItems: MetaItem[] = [];

      for (const item of items) {
         if (!ObjectId.isValid(item.plantId)) {
            res.status(400).json({ message: "Invalid plant ID in cart." });
            return;
         }

         const plant = await plantCollection.findOne({ _id: new ObjectId(item.plantId) });
         if (!plant) {
            res.status(404).json({ message: "One of the plants was not found." });
            return;
         }

         const qty = Number(item.quantity) || 1;
         if (plant.stock !== undefined && plant.stock < qty) {
            res.status(400).json({ message: `${plant.title} is out of stock.` });
            return;
         }

         line_items.push({
            price_data: {
               currency: "usd",
               product_data: { name: plant.title as string, images: (plant.images as string[])?.slice(0, 1) || [] },
               unit_amount: Math.round(Number(plant.price) * 100),
            },
            quantity: qty,
         });

         metaItems.push({ plantId: plant._id.toString(), title: plant.title as string, price: plant.price as number, quantity: qty });
      }

      const session = await stripe.checkout.sessions.create({
         mode: "payment",
         payment_method_types: ["card"],
         line_items,
         success_url: `${process.env.CLIENT_URL}/dashboard/orders?success=true`,
         cancel_url: `${process.env.CLIENT_URL}/cart?canceled=true`,
         customer_email: req.user!.email,
         metadata: {
            userEmail: req.user!.email!,
            items: JSON.stringify(metaItems),
         },
      });

      res.status(200).json({ url: session.url });
   } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to start checkout." });
   }
});

export default router;
