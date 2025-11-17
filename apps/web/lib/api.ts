// lib/api.ts
export type JobRecord = {
  id: string;
  filename?: string;
  template?: string;
  // Accept both snake_case (from backend) and camelCase (frontend)
  download_url?: string;
  downloadUrl?: string;
  createdAt?: number | string;
  warnings?: string[];
  [k: string]: any;
};

const defaultBase = "http://localhost:8000";

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (!env) return defaultBase;
  return env.replace(/\/$/, "");
}

/**
 * Fetch the remote job list from /api/jobs (if available).
 * Returns [] on network/404/etc. so dashboard falls back to local history.
 */
export async function listJobs(): Promise<JobRecord[]> {
  const base = baseUrl();
  try {
    const res = await fetch(`${base}/api/jobs`, {
      method: "GET",
    });
    if (!res.ok) {
      // Not found or server error — return empty so UI can fall back to local
      return [];
    }
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json as JobRecord[];
  } catch (_err) {
    // network or CORS error — return empty for graceful fallback
    return [];
  }
}

/**
 * Upload a file (zip or tex) to the API /api/format endpoint.
 * - file: File object from input
 * - template: string (e.g. "aastex")
 * - options: string[] (converted to CSV)
 *
 * Returns parsed JSON from backend (job_id, warnings, download_url, etc.)
 */
export async function uploadArchive(
  file: File,
  template = "aastex",
  options: string[] = []
): Promise<any> {
  const base = baseUrl();
  const form = new FormData();
  // backend accepts either "file" or "archive"; we use "file"
  form.append("file", file);
  form.append("template", template);
  form.append("options", options.join(","));

  const res = await fetch(`${base}/api/format`, {
    method: "POST",
    body: form,
    // Do not set Content-Type — the browser will set boundary
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`uploadArchive failed: ${res.status} ${res.statusText} ${txt}`);
  }

  return res.json();
}
