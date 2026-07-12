// Automates the "deploy a new storefront + wire up its env vars" step described
// in STOREFRONT_INTEGRATION.md — creates a Vercel project linked to the storefront
// git repo, sets STORE_ID/CRM_API_KEY/CRM_BASE_URL, and triggers a production deploy.
const VERCEL_API = "https://api.vercel.com";

function teamQuery(): string {
  return process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
}

async function vercelFetch(path: string, init?: RequestInit & { allow404?: boolean }): Promise<unknown> {
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

  if (init?.allow404 && res.status === 404) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: { message?: string } })?.error?.message ?? `Vercel API error (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export type VercelEnvVar = { key: string; value: string; sensitive?: boolean };

export type CreatedProject = { projectId: string; name: string; url: string; repoId: number };

// Looks up a project by its (deterministic) name so redeploys can be detected even if our
// own DB record is missing/stale — Vercel's project list is the source of truth, not our cache.
export async function findProjectByName(name: string): Promise<CreatedProject | null> {
  const project = await vercelFetch(`/v9/projects/${encodeURIComponent(name)}${teamQuery()}`, { allow404: true }) as
    { id: string; name: string; link?: { repoId?: number } } | null;

  if (!project?.link?.repoId) return null;
  return { projectId: project.id, name: project.name, url: `https://${project.name}.vercel.app`, repoId: project.link.repoId };
}

// Creates a new Vercel project linked to STOREFRONT_GIT_REPO with the given env vars
// pre-populated. Does not deploy — call triggerDeployment() with the returned repoId next.
export async function createStorefrontProject(opts: {
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

  return { projectId: project.id, name: project.name, url: `https://${project.name}.vercel.app`, repoId };
}

// Overwrites (or creates) each of the given env vars on an existing project — used when
// redeploying, in case values like CRM_BASE_URL changed since the project was first created.
export async function upsertProjectEnvVars(projectId: string, envVars: VercelEnvVar[]): Promise<void> {
  const existing = await vercelFetch(`/v10/projects/${projectId}/env${teamQuery()}`) as {
    envs?: Array<{ id: string; key: string }>;
  };

  for (const v of envVars) {
    const match = existing.envs?.find(e => e.key === v.key);
    const body = JSON.stringify({
      key: v.key,
      value: v.value,
      type: v.sensitive ? "encrypted" : "plain",
      target: ["production", "preview", "development"],
    });

    if (match) {
      await vercelFetch(`/v9/projects/${projectId}/env/${match.id}${teamQuery()}`, { method: "PATCH", body });
    } else {
      await vercelFetch(`/v10/projects/${projectId}/env${teamQuery()}`, { method: "POST", body });
    }
  }
}

// Triggers a production deployment from the storefront repo's default branch, against an
// already-created (or already-linked) project.
export async function triggerDeployment(opts: { projectId: string; projectName: string; repoId: number }): Promise<void> {
  await vercelFetch(`/v13/deployments${teamQuery()}`, {
    method: "POST",
    body: JSON.stringify({
      name: opts.projectName,
      project: opts.projectId,
      target: "production",
      gitSource: { type: "github", repoId: opts.repoId, ref: "main" },
      // Required on a project's very first deployment — Vercel has no prior build to infer
      // framework/build settings from yet. The storefront is always Next.js, so declare it.
      projectSettings: { framework: "nextjs" },
    }),
  });
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

export type ProjectDomain = { name: string; verified: boolean; misconfigured: boolean };

// Always fetched live from Vercel rather than cached locally — domain state (DNS propagation,
// verification) changes outside crm-dash entirely, so a local cache would just go stale.
export async function listProjectDomains(projectId: string): Promise<ProjectDomain[]> {
  const data = await vercelFetch(`/v9/projects/${projectId}/domains${teamQuery()}`) as {
    domains?: Array<{ name: string; verified: boolean }>;
  };

  const domains = data.domains ?? [];
  return Promise.all(domains.map(async d => ({
    name: d.name,
    verified: d.verified,
    misconfigured: await isDomainMisconfigured(d.name),
  })));
}

async function isDomainMisconfigured(domain: string): Promise<boolean> {
  try {
    const config = await vercelFetch(`/v6/domains/${encodeURIComponent(domain)}/config${teamQuery()}`) as { misconfigured?: boolean };
    return !!config.misconfigured;
  } catch {
    // If we can't check, don't block the UI on it — verified/unverified from the domains
    // list is still shown regardless.
    return false;
  }
}

// Attaches a domain to the project. Vercel accepts the request even if DNS isn't pointed at
// it yet — verified/misconfigured only become accurate once the owner updates their DNS.
export async function addDomainToProject(projectId: string, domain: string): Promise<void> {
  await vercelFetch(`/v10/projects/${projectId}/domains${teamQuery()}`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });
}

export async function removeDomainFromProject(projectId: string, domain: string): Promise<void> {
  await vercelFetch(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${teamQuery()}`, { method: "DELETE" });
}
