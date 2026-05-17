import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  const client = new MongoClient(process.env.DATABASE_URL!);
  await client.connect();
  const store = await client.db().collection("Store").findOne(
    { _id: new ObjectId("69fce8c3500a2de9b1f1e79c") },
    { projection: { name: 1, "content.en.home.hero": 1, "content.fr.home.hero": 1, "content.ar.home.hero": 1 } }
  );
  console.log(JSON.stringify(store, null, 2));
  await client.close();
}

run().catch(e => { console.error(e); process.exit(1); });
