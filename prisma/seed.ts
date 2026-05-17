import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.DATABASE_URL!;

async function main() {
  const client = new MongoClient(uri);
  await client.connect();

  const db    = client.db();
  const users = db.collection("User");

  const email    = "zakaria.tejjani@gmail.com";
  const password = "Sr9g1c5e@";
  const name     = "Zakaria Tejjani";

  const hashed = await bcrypt.hash(password, 12);
  const now    = new Date();

  const result = await users.findOneAndUpdate(
    { email },
    {
      $set:         { name, password: hashed, updatedAt: now },
      $setOnInsert: { _id: new ObjectId(), role: "owner", emailVerified: null, image: null, createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );

  console.log(`✅ Seeded user: ${result?.email} (id: ${result?._id})`);

  await client.close();
}

main().catch(e => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
