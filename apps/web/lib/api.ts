// apps/web/lib/api.ts
// Small client wrapper used by the dashboard to call backend endpoints.
// Exports named functions that return JSON-friendly data.

export type JobRecord = {
  id: string;
  createdAt: number;
  filename: string;
  size?: number;
  template?: string;
  options?: string[];
  warnings?: string[];
  status?: string;
  download_url?: string | null;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "") || "";

async function fetchJson(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = new Error((body && (body.message || body.detail)) || `Request failed ${res.status}`);
    // @ts-ignore
    err.status = res.status;
    // @ts-ignore
    err.body = body;
    throw err;
  }
  return body;
}

/** listJobs - call remote API to get jobs. */
export async function listJobs(): Promise<JobRecord[]> {
  const base = API_BASE || "/api";
  const url = `${base}/jobs`;
  const body = await fetchJson(url, { method: "GET", headers: { "Accept": "application/json" } });
  if (!Array.isArray(body)) return [];
  return body as JobRecord[];
}

/** createJob - send a job to the backend (example) */
export async function createJob(payload: Partial<JobRecord>): Promise<JobRecord> {
  const base = API_BASE || "/api";
  return await fetchJson(`${base}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** health helper for a simple check */
export async function health(): Promise<{ ok: boolean; status?: number; detail?: any }> {
  try {
    const base = API_BASE || "/api";
    const res = await fetch(`${base}/health`);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, detail: err };
  }
}

