import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";

import verifyToken from "../middleware/verifyToken";
import verifyAdmin from "../middleware/verifyAdmin";
import { getCollections } from "../db";

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
       const { userCollection } = getCollections();
       const users = await userCollection
          .find()
          .project({ name: 1, email: 1, image: 1, role: 1, createdAt: 1 })
          .sort({ createdAt: -1 })
          .toArray();

       const formattedUsers = users.map((user) => ({
          _id: user._id.toString(),
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role || "user",
          createdAt: user.createdAt?.toISOString(),
       }));

       res.status(200).json({ users: formattedUsers });
    } catch (error) {
       console.error("Error fetching users:", error);
       res.status(500).json({ message: "Failed to fetch users." });
    }
});

router.get("/role/:email", verifyToken, async (req: Request, res: Response): Promise<void> => {
   try {
      const { userCollection } = getCollections();
      const { email } = req.params;
      const user = await userCollection.findOne({ email }, { projection: { role: 1 } });
      if (!user) {
         res.status(404).json({ message: "User not found." });
         return;
      }
      res.status(200).json({ role: user.role || "user" });
   } catch (error) {
      console.error("Error fetching user role:", error);
      res.status(500).json({ message: "Failed to fetch user role." });
   }
});

router.get("/:email", verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
       const { userCollection } = getCollections();
       const { email } = req.params;
       const user = await userCollection.findOne(
          { email },
          { projection: { name: 1, email: 1, image: 1, role: 1, createdAt: 1 } }
       );
       if (!user) {
          res.status(404).json({ message: "User not found." });
          return;
       }
       res.status(200).json({
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role || "user",
          createdAt: user.createdAt?.toISOString(),
       });
    } catch (error) {
       console.error("Error fetching user:", error);
       res.status(500).json({ message: "Failed to fetch user." });
    }
});

router.patch("/admin/:id", verifyToken, verifyAdmin, async (req: Request, res: Response): Promise<void> => {
   try {
      const { userCollection } = getCollections();
      const id = req.params.id as string;
      if (!ObjectId.isValid(id)) {
         res.status(400).json({ message: "Invalid User ID" });
         return;
      }

      const result = await userCollection.updateOne({ _id: new ObjectId(id) }, { $set: { role: "admin" } });
      if (result.matchedCount === 0) {
         res.status(404).json({ message: "User not found." });
         return;
      }

      res.status(200).json({ success: true, message: "User promoted to admin." });
   } catch (error) {
      console.error("Error making admin:", error);
      res.status(500).json({ message: "Failed to update user role." });
   }
});

router.patch("/:id", verifyToken, async (req: Request, res: Response): Promise<void> => {
   try {
      const { userCollection } = getCollections();
      const id = req.params.id as string;
      if (!ObjectId.isValid(id)) {
         res.status(400).json({ message: "Invalid User ID" });
         return;
      }

      const targetUser = await userCollection.findOne({ _id: new ObjectId(id) });
      if (!targetUser) {
         res.status(404).json({ message: "User not found." });
         return;
      }
      if (targetUser.email !== req.user?.email) {
         res.status(403).json({ message: "forbidden access" });
         return;
      }

      const { name, image } = req.body;
      const fields: Record<string, string> = {};
      if (name !== undefined && name !== "") fields.name = name;
      if (image !== undefined && image !== "") fields.image = image;

      if (Object.keys(fields).length === 0) {
         res.status(400).json({ message: "No valid fields provided to update." });
         return;
      }

      await userCollection.updateOne({ _id: new ObjectId(id as string) }, { $set: fields });
      res.status(200).json({ success: true, message: "Profile updated successfully." });
   } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
   }
});

export default router;
