declare namespace Express {
   interface Request {
      user?: {
         email?: string;
         name?: string;
         sub?: string;
         [key: string]: unknown;
      };
      dbUser?: {
         email: string;
         name?: string;
         image?: string;
         role: string;
         createdAt?: Date;
         [key: string]: unknown;
      };
   }
}
