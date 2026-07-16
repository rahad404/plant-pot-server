import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// POST /api/auth/jwt
// Called by the frontend right after Firebase/OAuth login succeeds.
// Body: { email, name?, uid? }
router.post("/jwt", (req: Request, res: Response): void => {
   try {
      const { email, name, uid } = req.body as { email?: string; name?: string; uid?: string };

      if (!email) {
         res.status(400).json({ message: "Email is required." });
         return;
      }

      const secret = process.env.ACCESS_TOKEN_SECRET;
      if (!secret) {
         console.error("ACCESS_TOKEN_SECRET is not set");
         res.status(500).json({ message: "Server misconfiguration" });
         return;
      }

      const token = jwt.sign({ sub: uid || email, email, name }, secret, { expiresIn: "7d" });

      res.status(200).json({ token });
   } catch (error) {
      console.error("Error issuing token:", error);
      res.status(500).json({ message: "Failed to issue token." });
   }
});

export default router;
