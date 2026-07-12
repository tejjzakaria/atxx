import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { getStoreById } from "@/lib/db/stores";
import { createStorefrontDeployment, getLatestDeploymentStatus } from "@/lib/vercel";

type Ctx = { params: Promise<{ id: string }> };

function generateApiKey(): string {
  return "atxx_sk_" + randomBytes(24).toString("hex");
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "store";
}

/* ── POST /api/stores/[id]/deploy — create a Vercel project + trigger deploy ── */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await getStoreById(id, session.user.id);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const crmBaseUrl = process.env.AUTH_URL;
  if (!crmBaseUrl) {
    return NextResponse.json({ error: "AUTH_URL is not configured on the CRM — cannot tell the storefront where to fetch content from" }, { status: 500 });
  }

  const db  = getDb();
  const oid = new ObjectId(id);

  let apiKey = store.apiKey;
  if (!apiKey) {
    apiKey = generateApiKey();
    await db.collection("Store").updateOne({ _id: oid }, { $set: { apiKey } });
  }

  const projectName = `venom-${slugify(store.name)}-${id.slice(-6)}`;

  try {
    const deployment = await createStorefrontDeployment({
      projectName,
      envVars: [
        { key: "STORE_ID",     value: id },
        { key: "CRM_API_KEY",  value: apiKey, sensitive: true },
        { key: "CRM_BASE_URL", value: crmBaseUrl },
      ],
    });

    await db.collection("Store").updateOne(
      { _id: oid },
      {
        $set: {
          deploy: {
            vercelProjectId: deployment.projectId,
            url:             deployment.url,
            status:          "pending",
            lastDeployedAt:  new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({ ok: true, deploy: { vercelProjectId: deployment.projectId, url: deployment.url, status: "pending" } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deployment failed";
    await db.collection("Store").updateOne(
      { _id: oid },
      { $set: { deploy: { status: "error", error: message }, updatedAt: new Date() } },
    );
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/* ── GET /api/stores/[id]/deploy — poll latest deployment status ─────────── */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await getStoreById(id, session.user.id);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!store.deploy?.vercelProjectId) {
    return NextResponse.json({ deploy: store.deploy ?? null });
  }

  try {
    const status = await getLatestDeploymentStatus(store.deploy.vercelProjectId);
    const db  = getDb();
    const oid = new ObjectId(id);

    const deploy = {
      ...store.deploy,
      status: status.status,
      url:    status.url ?? store.deploy.url,
    };

    await db.collection("Store").updateOne({ _id: oid }, { $set: { deploy, updatedAt: new Date() } });

    return NextResponse.json({ deploy });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to check deployment status";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
