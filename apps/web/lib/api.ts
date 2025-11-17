// lib/api.ts
export type JobRecord = {
  id: string;
  filename?: string;
  template?: string;
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
 * Fetch remote jobs. Returns [] on any error so UI can fallback to local history.
 */
export async function listJobs(): Promise<JobRecord[]> {
  const base = baseUrl();
  try {
    const res = await fetch(`${base}/api/jobs`, { method: "GET" });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json as JobRecord[];
  } catch {
    return [];
  }
}

/**
 * Upload a file to /api/format.
 * Returns the parsed JSON response from the backend (job_id, warnings, download_url, etc).
 */
export async function uploadArchive(
  file: File,
  template = "aastex",
  options: string[] = []
): Promise<any> {
  const base = baseUrl();
  const form = new FormData();
  // backend accepts either 'file' or 'archive'
  form.append("file", file);
  form.append("template", template);
  form.append("options", options.join(","));

  const res = await fetch(`${base}/api/format`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`uploadArchive failed: ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json();
}
