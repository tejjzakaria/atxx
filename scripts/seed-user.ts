import "dotenv/config";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const URI   = process.env.DATABASE_URL!;
const EMAIL = "aa.aitlhaj@gmail.com";
const PASS  = "Sr9g1c5e@";
const NAME  = "AA Aitlhaj";

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  const db    = client.db();
  const users = db.collection("User");

  const existing = await users.findOne({ email: EMAIL });
  if (existing) {
    console.log("User already exists:", EMAIL);
    await client.close();
    return;
  }

  const hashed = await bcrypt.hash(PASS, 12);
  await users.insertOne({
    name:      NAME,
    email:     EMAIL,
    password:  hashed,
    createdAt: new Date(),
  });

  console.log("User created:", EMAIL);
  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
