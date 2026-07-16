import "express";

export interface DecodedUser {
   sub?: string;
   email: string;
   name?: string;
   role?: string;
   [key: string]: unknown;
}

declare global {
   namespace Express {
      interface Request {
         user?: DecodedUser;
      }
   }
}
