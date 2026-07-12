import "dotenv/config";
import { MongoClient } from "mongodb";

const URI   = process.env.DATABASE_URL!;
const EMAIL = "zakaria.tejjani@gmail.com"; // edit before running

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  const db    = client.db();
  const users = db.collection("User");

  const result = await users.updateOne(
    { email: EMAIL },
    { $set: { role: "admin", updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    console.log("No user found for", EMAIL);
  } else {
    console.log("Promoted to admin:", EMAIL);
  }

  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
