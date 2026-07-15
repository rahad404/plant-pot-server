import { Request, Response, NextFunction } from "express";
import { getCollections } from "../db";

const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
      const { userCollection } = getCollections();
      const email = req.user?.email;
      const user = await userCollection.findOne({ email });
      if (!user || user.role !== "admin") {
         res.status(403).json({ message: "forbidden access" });
         return;
      }
      req.dbUser = user as unknown as Request["dbUser"];
      next();
   } catch (error) {
      console.error("verifyAdmin error:", error);
      res.status(500).json({ message: "Server error" });
   }
};

export default verifyAdmin;
