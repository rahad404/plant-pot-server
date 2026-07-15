import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";

import verifyToken from "../middleware/verifyToken";
import verifyAdmin from "../middleware/verifyAdmin";
import { getCollections } from "../db";
import { escapeRegex } from "../utils/regex";

const router = express.Router();

router.get("/categories", async (_req: Request, res: Response): Promise<void> => {
   try {
      const { plantCollection } = getCollections();
      const categories = await plantCollection.distinct("category");
      res.status(200).json(categories);
   } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories." });
   }
});

router.get("/", async (req: Request, res: Response): Promise<void> => {
   try {
      const { plantCollection } = getCollections();
      const { search, category, minPrice, maxPrice, rating, light, sort, page = "1", limit = "12" } = req.query as Record<string, string | undefined>;

      const query: Record<string, unknown> = {};

      if (search?.trim()) {
         const safe = escapeRegex(search.trim());
         query.$or = [
            { title: { $regex: safe, $options: "i" } },
            { shortDesc: { $regex: safe, $options: "i" } },
            { category: { $regex: safe, $options: "i" } },
         ];
      }

      if (category?.trim() && category !== "all") query.category = category.trim();
      if (light?.trim() && light !== "all") query.light = light.trim();

      if (minPrice || maxPrice) {
         query.price = {};
         if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
         if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
      }

      if (rating) query.ratingAvg = { $gte: Number(rating) };

      let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
      if (sort === "price_asc") sortQuery = { price: 1 };
      if (sort === "price_desc") sortQuery = { price: -1 };
      if (sort === "rating_desc") sortQuery = { ratingAvg: -1 };

      const pageNum = Math.max(Number(page) || 1, 1);
      const limitNum = Math.min(Number(limit) || 12, 50);
      const skip = (pageNum - 1) * limitNum;

      const [plants, total] = await Promise.all([
         plantCollection.find(query).sort(sortQuery).skip(skip).limit(limitNum).toArray(),
         plantCollection.countDocuments(query),
      ]);

      res.status(200).json({ plants, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
   } catch (error) {
      console.error("Error fetching plants:", error);
      res.status(500).json({ message: "Failed to fetch plants." });
   }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
   try {
      const { plantCollection } = getCollections();
      const id = req.params.id as string;
      if (!ObjectId.isValid(id)) {
         res.status(400).json({ message: "Invalid Plant ID" });
         return;
      }

      const plant = await plantCollection.findOne({ _id: new ObjectId(id) });
      if (!plant) {
         res.status(404).json({ message: "Plant not found." });
         return;
      }

      res.status(200).json(plant);
   } catch (error) {
      console.error("Error fetching plant:", error);
      res.status(500).json({ message: "Failed to fetch plant details." });
   }
});

router.post("/", verifyToken, verifyAdmin, async (req: Request, res: Response): Promise<void> => {
   try {
      const { plantCollection } = getCollections();
      const { title, shortDesc, fullDesc, price, category, images = [], light, watering, careLevel, careTips, stock } =
         req.body;

      if (!title || !price || !category) {
         res.status(400).json({ message: "title, price and category are required." });
         return;
      }

      const newPlant = {
         title,
         shortDesc: shortDesc || "",
         fullDesc: fullDesc || "",
         price: Number(price),
         category,
         images,
         light: light || "",
         watering: watering || { frequencyDays: 7, amount: "" },
         careLevel: careLevel || "easy",
         careTips: careTips || {},
         stock: stock !== undefined ? Number(stock) : 0,
         ratingAvg: 0,
         ratingCount: 0,
         createdAt: new Date(),
         updatedAt: new Date(),
      };

      const result = await plantCollection.insertOne(newPlant);
      res.status(201).json({ success: true, message: "Plant added.", plantId: result.insertedId });
   } catch (error) {
      console.error("Error adding plant:", error);
      res.status(500).json({ message: "Failed to add plant." });
   }
});

router.put("/:id", verifyToken, verifyAdmin, async (req: Request, res: Response): Promise<void> => {
   try {
      const { plantCollection } = getCollections();
      const id = req.params.id as string;
      if (!ObjectId.isValid(id)) {
         res.status(400).json({ message: "Invalid Plant ID" });
         return;
      }

      const updates: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
      delete updates._id;
      if (updates.price !== undefined) updates.price = Number(updates.price);
      if (updates.stock !== undefined) updates.stock = Number(updates.stock);

      const result = await plantCollection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      if (result.matchedCount === 0) {
         res.status(404).json({ message: "Plant not found." });
         return;
      }

      res.status(200).json({ success: true, message: "Plant updated successfully." });
   } catch (error) {
      console.error("Error updating plant:", error);
      res.status(500).json({ message: "Failed to update plant." });
   }
});

router.delete("/:id", verifyToken, verifyAdmin, async (req: Request, res: Response): Promise<void> => {
   try {
      const { plantCollection } = getCollections();
      const id = req.params.id as string;
      if (!ObjectId.isValid(id)) {
         res.status(400).json({ message: "Invalid Plant ID" });
         return;
      }

      const result = await plantCollection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
         res.status(404).json({ message: "Plant not found." });
         return;
      }

      res.status(200).json({ success: true, message: "Plant deleted successfully." });
   } catch (error) {
      console.error("Error deleting plant:", error);
      res.status(500).json({ message: "Failed to delete plant." });
   }
});

router.post("/:id/reviews", verifyToken, async (req: Request, res: Response): Promise<void> => {
   try {
      const { plantCollection, reviewCollection } = getCollections();
      const id = req.params.id as string;
      if (!ObjectId.isValid(id)) {
         res.status(400).json({ message: "Invalid Plant ID" });
         return;
      }

      const numRating = Number(req.body.rating);
      if (!numRating || numRating < 1 || numRating > 5) {
         res.status(400).json({ message: "Rating must be between 1 and 5." });
         return;
      }

      const plant = await plantCollection.findOne({ _id: new ObjectId(id) });
      if (!plant) {
         res.status(404).json({ message: "Plant not found." });
         return;
      }

      await reviewCollection.insertOne({
         plantId: new ObjectId(id),
         userEmail: req.user!.email,
         userName: req.user!.name || req.user!.email,
         rating: numRating,
         comment: req.body.comment || "",
         createdAt: new Date(),
      });

      const agg = await reviewCollection
         .aggregate([
            { $match: { plantId: new ObjectId(id) } },
            { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
         ])
         .toArray();

      const ratingAvg = Math.round((agg[0]?.avg || numRating) * 10) / 10;
      const ratingCount = agg[0]?.count || 1;

      await plantCollection.updateOne({ _id: new ObjectId(id) }, { $set: { ratingAvg, ratingCount } });

      res.status(201).json({ success: true, message: "Review submitted." });
   } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ message: "Failed to submit review." });
   }
});

router.get("/:id/reviews", async (req: Request, res: Response): Promise<void> => {
   try {
      const { reviewCollection } = getCollections();
      const id = req.params.id as string;
      if (!ObjectId.isValid(id)) {
         res.status(400).json({ message: "Invalid Plant ID" });
         return;
      }

      const { page = "1", limit = "10" } = req.query as Record<string, string | undefined>;
      const pageNum = Math.max(Number(page) || 1, 1);
      const limitNum = Math.min(Number(limit) || 10, 50);
      const skip = (pageNum - 1) * limitNum;

      const [reviews, total] = await Promise.all([
         reviewCollection.find({ plantId: new ObjectId(id) }).sort({ createdAt: -1 }).skip(skip).limit(limitNum).toArray(),
         reviewCollection.countDocuments({ plantId: new ObjectId(id) }),
      ]);

      res.status(200).json({ reviews, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
   } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews." });
   }
});

export default router;
