// apps/web/lib/api.ts
export type JobRecord = {
  id: string;
  filename?: string;
  template?: string;
  download_url?: string;
  downloadUrl?: string;
  createdAt?: number | string;
  warnings?: string[];
  size?: number;
  options?: string[];
  [k: string]: any;
};

/**
 * Resolve base URL for backend API.
 * If NEXT_PUBLIC_API_URL is set in the environment, use that (trim trailing slash).
 * Otherwise return empty string so fetch('/api/...') uses the current origin (works for serverless/web-hosted API).
 */
function baseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (!env) return "";
  return env.replace(/\/$/, "");
}

/**
 * Fetch remote jobs. Returns [] on any error so UI can fallback to local history.
 */
export async function listJobs(): Promise<JobRecord[]> {
  const b = baseUrl();
  const url = (b ? `${b}` : "") + "/api/jobs";
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json as JobRecord[];
  } catch {
    return [];
  }
}

/**
 * Upload an archive/file to the backend /api/format endpoint.
 * Returns parsed JSON response from backend (job_id, warnings, download_url, etc.)
 * Throws on HTTP non-OK.
 */
export async function uploadArchive(
  file: File,
  template = "aastex",
  options: string[] = []
): Promise<any> {
  const b = baseUrl();
  const url = (b ? `${b}` : "") + "/api/format";
  const form = new FormData();
  // backend may accept either 'file' or 'archive'
  form.append("file", file);
  form.append("template", template);
  form.append("options", options.join(","));

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`uploadArchive failed: ${res.status} ${res.statusText} ${txt}`);
  }

  return res.json();
}
