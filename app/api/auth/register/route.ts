import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const db    = getDb();
    const users = db.collection("User");

    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const now    = new Date();

    const result = await users.insertOne({
      _id:           new ObjectId(),
      name,
      email,
      password:      hashed,
      role:          "owner",
      emailVerified: null,
      image:         null,
      createdAt:     now,
      updatedAt:     now,
    });

    return NextResponse.json(
      { id: result.insertedId.toString(), name, email, role: "owner" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
