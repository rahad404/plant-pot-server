import { createRemoteJWKSet, jwtVerify } from "jose";
import { Request, Response, NextFunction } from "express";

let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
   if (!JWKS) {
      const clientUrl = process.env.CLIENT_URL;
      if (!clientUrl) {
         throw new Error("CLIENT_URL environment variable is not set");
      }
      JWKS = createRemoteJWKSet(new URL(`${clientUrl}/api/auth/jwks`));
   }
   return JWKS;
}

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
      const jwks = getJWKS();
      const { payload } = await jwtVerify(token, jwks);
      req.user = payload as Request["user"];
      next();
   } catch (error) {
      console.error("verifyToken error:", error);
      res.status(401).json({ message: "unauthorized" });
   }
};

export default verifyToken;
