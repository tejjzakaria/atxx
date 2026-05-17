import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { presignUpload, s3PublicUrl } from "@/lib/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename, contentType, size, storeId } = await req.json();

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (typeof size === "number" && size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
  }
  if (!storeId) {
    return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
  }

  const ext = filename?.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `stores/${storeId}/products/${randomUUID()}.${ext}`;

  const uploadUrl = await presignUpload(key, contentType);
  const publicUrl = s3PublicUrl(key);

  return NextResponse.json({ uploadUrl, publicUrl });
}
