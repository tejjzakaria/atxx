import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/db/settings";

/* ── GET /api/admin/settings — platform defaults + deploy config status ──── */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getPlatformSettings();
  return NextResponse.json({
    ...settings,
    deploy: {
      vercelTokenConfigured: !!process.env.VERCEL_API_TOKEN,
      storefrontRepo:        process.env.STOREFRONT_GIT_REPO ?? null,
      vercelTeamId:           process.env.VERCEL_TEAM_ID ?? null,
    },
  });
}

/* ── PATCH /api/admin/settings — update platform defaults ────────────────── */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { defaultCurrency, defaultCountry } = await req.json().catch(() => ({}));
  const patch: { defaultCurrency?: string; defaultCountry?: string } = {};
  if (typeof defaultCurrency === "string") patch.defaultCurrency = defaultCurrency;
  if (typeof defaultCountry  === "string") patch.defaultCountry  = defaultCountry;

  await updatePlatformSettings(patch);
  return NextResponse.json({ ok: true });
}
