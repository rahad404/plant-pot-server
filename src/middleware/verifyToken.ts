import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { DecodedUser } from "../types/express";

const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
   const authHeader = req.headers.authorization;

   if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized access" });
      return;
   }

   const token = authHeader.split(" ")[1];
   const secret = process.env.ACCESS_TOKEN_SECRET;

   if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is not set");
      res.status(500).json({ message: "Server misconfiguration" });
      return;
   }

   jwt.verify(token, secret, (err, decoded) => {
      if (err || !decoded) {
         res.status(401).json({ message: "Unauthorized access" });
         return;
      }
      req.user = decoded as DecodedUser;
      next();
   });
};

export default verifyToken;
