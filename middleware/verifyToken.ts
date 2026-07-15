import { createRemoteJWKSet, jwtVerify } from "jose";
import { Request, Response, NextFunction } from "express";

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   const authHeader = req?.headers.authorization;
   if (!authHeader) {
      res.status(401).json({ message: "unauthorized" });
      return;
   }
   const token = authHeader.split(" ")[1];

   if (!token) {
      res.status(401).json({ message: "unauthorized" });
      return;
   }

   try {
      const { payload } = await jwtVerify(token, JWKS);
      req.user = payload as Request["user"];
      next();
   } catch (error) {
      console.error("verifyToken error:", error);
      res.status(401).json({ message: "unauthorized" });
   }
};

export default verifyToken;
