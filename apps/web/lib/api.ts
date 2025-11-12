// apps/web/lib/api.ts
/* Public API wrapper used by front-end pages (upload, dashboard, etc.) */

export type JobRecord = {
  id: string;
  createdAt?: number | string;
  filename?: string;
  size?: number;
  template?: string;
  options?: string[];
  warnings?: string[];
  status?: string;
  download_url?: string;
  output_path?: string;
  [k: string]: any;
};

const envBase = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
export const API_BASE = envBase || (typeof window !== "undefined" ? `${window.location.origin}` : "http://localhost:8000");

/** internal helper to build full url */
function url(path = "") {
  if (!path.startsWith("/")) path = "/" + path;
  return `${API_BASE}${path}`;
}

/** Generic fetch wrapper that throws an Error with server message on non-2xx */
async function doFetch(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  let body;
  try {
    body = await res.json().catch(() => null);
  } catch (e) {
    body = null;
  }
  if (!res.ok) {
    const msg = body && body.detail ? body.detail : body || `HTTP ${res.status}`;
    const err: any = new Error(String(msg));
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/** Upload a zip/.tex file (FormData) — returns job { job_id, download_url } or server response */
export async function uploadArchive(file: File, template = "aastex", options: string[] = []) {
  const fd = new FormData();
  fd.append("file", file, file.name);
  fd.append("template", template);
  if (options && options.length) fd.append("options", JSON.stringify(options));

  // Post to /format (backend expects /format)
  const endpoint = url("/format");
  const res = await fetch(endpoint, {
    method: "POST",
    body: fd,
    // do NOT set Content-Type for FormData
  });

  if (!res.ok) {
    let errBody;
    try { errBody = await res.json(); } catch (e) { errBody = await res.text().catch(() => null); }
    const msg = (errBody && errBody.detail) || (errBody && errBody.message) || `Upload failed ${res.status}`;
    const e = new Error(msg);
    (e as any).status = res.status;
    (e as any).body = errBody;
    throw e;
  }

  // parse JSON
  const body = await res.json();
  return body;
}

/** convenience wrapper that sends JSON to /jobs to create a job record (if used) */
export async function createJob(job: JobRecord) {
  return doFetch(url("/jobs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
}

/** list jobs from the backend /jobs endpoint (if present) */
export async function listJobs(): Promise<Record<string, JobRecord> | JobRecord[]> {
  const body = await doFetch(url("/jobs"));
  // backend may return shape { ok: true, jobs: {...} } or array
  if (body && body.jobs) return body.jobs;
  return body;
}

/** health check */
export async function health() {
  try {
    const body = await doFetch(url("/health"));
    return body;
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

/** download helper - returns a URL you can use to download or fetch */
export function downloadUrlFor(jobId: string) {
  return url(`/download/${encodeURIComponent(jobId)}`);
}

export default {
  uploadArchive,
  createJob,
  listJobs,
  health,
  downloadUrlFor,
};
