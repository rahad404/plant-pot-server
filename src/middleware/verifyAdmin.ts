import { Request, Response, NextFunction } from "express";

import { getCollections } from "../db";

const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
      const email = req.user?.email;
      if (!email) {
         res.status(401).json({ message: "Unauthorized access" });
         return;
      }

      const { userCollection } = getCollections();
      const user = await userCollection.findOne({ email });

      if (!user || user.role !== "admin") {
         res.status(403).json({ message: "forbidden access" });
         return;
      }

      next();
   } catch (error) {
      console.error("Error verifying admin:", error);
      res.status(500).json({ message: "Server error" });
   }
};

export default verifyAdmin;
