import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStoreById } from "@/lib/db/stores";
import { listProjectDomains, addDomainToProject, removeDomainFromProject } from "@/lib/vercel";

type Ctx = { params: Promise<{ id: string }> };

async function resolveStoreWithProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const store = await getStoreById(id, session.user.id);
  if (!store) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };

  if (!store.deploy?.vercelProjectId) {
    return { error: NextResponse.json({ error: "Deploy this store's storefront before adding a domain" }, { status: 400 }) };
  }

  return { projectId: store.deploy.vercelProjectId };
}

/* ── GET /api/stores/[id]/domains — list domains + verification status ──── */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const resolved = await resolveStoreWithProject(id);
  if ("error" in resolved) return resolved.error;

  try {
    const domains = await listProjectDomains(resolved.projectId);
    return NextResponse.json({ domains });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list domains";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/* ── POST /api/stores/[id]/domains — attach a domain ─────────────────────── */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const resolved = await resolveStoreWithProject(id);
  if ("error" in resolved) return resolved.error;

  const { domain } = await req.json().catch(() => ({}));
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  try {
    await addDomainToProject(resolved.projectId, domain.trim().toLowerCase());
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add domain";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/* ── DELETE /api/stores/[id]/domains?domain=... — detach a domain ────────── */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const resolved = await resolveStoreWithProject(id);
  if ("error" in resolved) return resolved.error;

  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) return NextResponse.json({ error: "domain query param is required" }, { status: 400 });

  try {
    await removeDomainFromProject(resolved.projectId, domain);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove domain";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
