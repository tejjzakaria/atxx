// Automates the "deploy a new storefront + wire up its env vars" step described
// in STOREFRONT_INTEGRATION.md — creates a Vercel project linked to the storefront
// git repo, sets STORE_ID/CRM_API_KEY/CRM_BASE_URL, and triggers a production deploy.
const VERCEL_API = "https://api.vercel.com";

function teamQuery(): string {
  return process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
}

async function vercelFetch(path: string, init?: RequestInit): Promise<unknown> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) throw new Error("VERCEL_API_TOKEN is not configured");

  const res = await fetch(`${VERCEL_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: { message?: string } })?.error?.message ?? `Vercel API error (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export type VercelEnvVar = { key: string; value: string; sensitive?: boolean };

export type CreatedProject = { projectId: string; name: string; url: string };

// Creates a new Vercel project linked to STOREFRONT_GIT_REPO with the given env vars
// pre-populated, then triggers an initial production deployment from that repo's default branch.
export async function createStorefrontDeployment(opts: {
  projectName: string;
  envVars: VercelEnvVar[];
}): Promise<CreatedProject> {
  const repo = process.env.STOREFRONT_GIT_REPO;
  if (!repo) throw new Error("STOREFRONT_GIT_REPO is not configured");

  const project = await vercelFetch(`/v11/projects${teamQuery()}`, {
    method: "POST",
    body: JSON.stringify({
      name: opts.projectName,
      gitRepository: { type: "github", repo },
      environmentVariables: opts.envVars.map(v => ({
        key: v.key,
        value: v.value,
        type: v.sensitive ? "encrypted" : "plain",
        target: ["production", "preview", "development"],
      })),
    }),
  }) as { id: string; name: string; link?: { repoId?: number } };

  // /v13/deployments' gitSource needs the numeric GitHub repo id, not the "owner/repo"
  // string — Vercel resolves and returns it on `link.repoId` once the repo is linked above.
  const repoId = project.link?.repoId;
  if (!repoId) {
    throw new Error("Vercel didn't return a linked repository id — check that its GitHub integration has access to " + repo);
  }

  await vercelFetch(`/v13/deployments${teamQuery()}`, {
    method: "POST",
    body: JSON.stringify({
      name: project.name,
      project: project.id,
      target: "production",
      gitSource: { type: "github", repoId, ref: "main" },
      // Required on a project's very first deployment — Vercel has no prior build to infer
      // framework/build settings from yet. The storefront is always Next.js, so declare it.
      projectSettings: { framework: "nextjs" },
    }),
  });

  return { projectId: project.id, name: project.name, url: `https://${project.name}.vercel.app` };
}

export type DeploymentStatus = { status: "pending" | "ready" | "error" };

// Polls the most recent deployment for a project so the dashboard can show live progress.
// Deliberately doesn't return a URL: the per-deployment url Vercel's deployments list exposes
// (name-hash-teamscope.vercel.app) is often gated behind Vercel's own team auth for outsiders —
// the correct public URL is the stable https://{project.name}.vercel.app alias from creation time.
export async function getLatestDeploymentStatus(projectId: string): Promise<DeploymentStatus> {
  const data = await vercelFetch(
    `/v6/deployments${teamQuery()}${teamQuery() ? "&" : "?"}projectId=${encodeURIComponent(projectId)}&limit=1`,
  ) as { deployments?: Array<{ readyState: string }> };

  const latest = data.deployments?.[0];
  if (!latest) return { status: "pending" };

  const stateMap: Record<string, DeploymentStatus["status"]> = {
    READY: "ready",
    ERROR: "error",
    CANCELED: "error",
  };

  return { status: stateMap[latest.readyState] ?? "pending" };
}
