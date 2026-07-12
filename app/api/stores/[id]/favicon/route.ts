import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { resolveStoreForSession } from "@/lib/db/stores";
import { getDb } from "@/lib/mongodb";
import { s3, S3_BUCKET, s3PublicUrl } from "@/lib/s3";
import { ObjectId } from "mongodb";

const ALLOWED_TYPES = ["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB — favicons are small

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await resolveStoreForSession(id, session);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 2 MB limit" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const key = `stores/${id}/favicon.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  }));

  const url = s3PublicUrl(key);

  const db = getDb();
  await db.collection("Store").updateOne(
    { _id: new ObjectId(id) },
    { $set: { favicon: url, updatedAt: new Date() } }
  );

  return NextResponse.json({ url });
}
