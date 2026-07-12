import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { getStoreById } from "@/lib/db/stores";
import { createStorefrontProject, upsertProjectEnvVars, triggerDeployment, getLatestDeploymentStatus } from "@/lib/vercel";

type Ctx = { params: Promise<{ id: string }> };

function generateApiKey(): string {
  return "atxx_sk_" + randomBytes(24).toString("hex");
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "store";
}

/* ── POST /api/stores/[id]/deploy — create (or redeploy) the storefront ──── */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await getStoreById(id, session.user.id);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Derived from the request that hit crm-dash itself, so it's always correct regardless of
  // what (if anything) AUTH_URL is set to — no separate "where am I publicly reachable" config to drift.
  const crmBaseUrl = req.nextUrl.origin;

  const db  = getDb();
  const oid = new ObjectId(id);

  let apiKey = store.apiKey;
  if (!apiKey) {
    apiKey = generateApiKey();
    await db.collection("Store").updateOne({ _id: oid }, { $set: { apiKey } });
  }

  const envVars = [
    { key: "STORE_ID",     value: id },
    { key: "CRM_API_KEY",  value: apiKey, sensitive: true },
    { key: "CRM_BASE_URL", value: crmBaseUrl },
  ];

  try {
    let vercelProjectId = store.deploy?.vercelProjectId;
    let projectName     = store.deploy?.projectName;
    let repoId          = store.deploy?.repoId;
    let url             = store.deploy?.url;

    if (vercelProjectId && projectName && repoId) {
      // Redeploy: refresh env vars on the existing project (they may have changed, e.g.
      // CRM_BASE_URL) instead of trying to create a project that already exists.
      await upsertProjectEnvVars(vercelProjectId, envVars);
    } else {
      const created = await createStorefrontProject({
        projectName: `venom-${slugify(store.name)}-${id.slice(-6)}`,
        envVars,
      });
      vercelProjectId = created.projectId;
      projectName     = created.name;
      repoId          = created.repoId;
      url             = created.url;
    }

    await triggerDeployment({ projectId: vercelProjectId, projectName, repoId });

    const deploy = { vercelProjectId, projectName, repoId, url, status: "pending" as const, lastDeployedAt: new Date().toISOString() };
    await db.collection("Store").updateOne({ _id: oid }, { $set: { deploy, updatedAt: new Date() } });

    return NextResponse.json({ ok: true, deploy }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deployment failed";
    await db.collection("Store").updateOne(
      { _id: oid },
      { $set: { "deploy.status": "error", "deploy.error": message, updatedAt: new Date() } },
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
    };

    await db.collection("Store").updateOne({ _id: oid }, { $set: { deploy, updatedAt: new Date() } });

    return NextResponse.json({ deploy });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to check deployment status";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
