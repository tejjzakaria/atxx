import { MongoClient } from "mongodb";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const uri = process.env.DATABASE_URL;

const globalForMongo = globalThis as unknown as { _mongoClient: MongoClient };

const client = globalForMongo._mongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") globalForMongo._mongoClient = client;

export default client;

/** Convenience: return the app database */
export function getDb() {
  return client.db();
}
