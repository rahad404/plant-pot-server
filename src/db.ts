import { MongoClient, Collection, ServerApiVersion, Document } from "mongodb";

let client: MongoClient;
let isConnected = false;

let orderCollection: Collection<Document>;
let careScheduleCollection: Collection<Document>;
let contactCollection: Collection<Document>;
let plantCollection: Collection<Document>;
let reviewCollection: Collection<Document>;
let userCollection: Collection<Document>;

export const connectDB = async (): Promise<void> => {
   if (isConnected) return;

   const uri = process.env.MONGODB_URI;
   if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
   }

   client = new MongoClient(uri, {
      serverApi: {
         version: ServerApiVersion.v1,
         strict: true,
         deprecationErrors: true,
      },
   });

   await client.connect();
   await client.db("admin").command({ ping: 1 });

   const dbName = process.env.DB_NAME || "plantShopDB";
   const db = client.db(dbName);

   orderCollection = db.collection("orders");
   careScheduleCollection = db.collection("careSchedules");
   contactCollection = db.collection("contacts");
   plantCollection = db.collection("plants");
   reviewCollection = db.collection("reviews");
   userCollection = db.collection("users");

   isConnected = true;
   console.log(`✅ Connected to MongoDB database: ${dbName}`);
};

export const getCollections = () => {
   if (!isConnected) {
      throw new Error("Database not connected. connectDB() must resolve before handling requests.");
   }
   return {
      orderCollection,
      careScheduleCollection,
      contactCollection,
      plantCollection,
      reviewCollection,
      userCollection,
   };
};

export const closeDB = async (): Promise<void> => {
   if (client) {
      await client.close();
      isConnected = false;
   }
};
