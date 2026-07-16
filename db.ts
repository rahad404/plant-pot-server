import { MongoClient, ServerApiVersion, Db, Collection, Document } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

async function connectDB(): Promise<Db> {
   if (db) return db;

   const uri = process.env.MONGODB_URI;
   if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
   }

   client = new MongoClient(uri, {
      serverApi: {
         version: ServerApiVersion.v1,
         strict: true,
         deprecationErrors: true,
      },
      tls: true,
      tlsAllowInvalidCertificates: true,
   });

   await client.connect();
   console.log("MongoDB connected successfully!");
   db = client.db("plantshop");
   return db;
}

interface Collections {
   userCollection: Collection<Document>;
   plantCollection: Collection<Document>;
   orderCollection: Collection<Document>;
   careScheduleCollection: Collection<Document>;
   reviewCollection: Collection<Document>;
   contactCollection: Collection<Document>;
}

function getCollections(): Collections {
   if (!db) throw new Error("Database not connected yet. Call connectDB() before using collections.");
   return {
      userCollection: db.collection("user"),
      plantCollection: db.collection("plants"),
      orderCollection: db.collection("orders"),
      careScheduleCollection: db.collection("careSchedules"),
      reviewCollection: db.collection("reviews"),
      contactCollection: db.collection("contacts"),
   };
}

export { client, connectDB, getCollections };
