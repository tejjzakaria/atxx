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
  }) as { id: string; name: string };

  await vercelFetch(`/v13/deployments${teamQuery()}`, {
    method: "POST",
    body: JSON.stringify({
      name: project.name,
      project: project.id,
      target: "production",
      gitSource: { type: "github", repo, ref: "main" },
    }),
  });

  return { projectId: project.id, name: project.name, url: `https://${project.name}.vercel.app` };
}

export type DeploymentStatus = { status: "pending" | "ready" | "error"; url?: string };

// Polls the most recent deployment for a project so the dashboard can show live progress.
export async function getLatestDeploymentStatus(projectId: string): Promise<DeploymentStatus> {
  const data = await vercelFetch(
    `/v6/deployments${teamQuery()}${teamQuery() ? "&" : "?"}projectId=${encodeURIComponent(projectId)}&limit=1`,
  ) as { deployments?: Array<{ readyState: string; url: string }> };

  const latest = data.deployments?.[0];
  if (!latest) return { status: "pending" };

  const stateMap: Record<string, DeploymentStatus["status"]> = {
    READY: "ready",
    ERROR: "error",
    CANCELED: "error",
  };

  return {
    status: stateMap[latest.readyState] ?? "pending",
    url: latest.url ? `https://${latest.url}` : undefined,
  };
}
