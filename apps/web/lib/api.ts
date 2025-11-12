// apps/web/lib/api.ts
// Option B: use runtime env NEXT_PUBLIC_API_BASE if provided.
// If not provided it will fall back to "/api" (useful if you later choose a same-origin proxy).

export type JobRecord = {
  id: string;
  created_at: number;
  filename?: string | null;
  size?: number | null;
  template?: string | null;
  options?: string | null;
  warnings?: string | null;
  download_url?: string | null;
};

// Use the value from NEXT_PUBLIC_API_BASE (set in Vercel/Netlify/Render),
// otherwise default to same-origin /api
const BASE = (typeof window !== "undefined" && (process.env.NEXT_PUBLIC_API_BASE || "/api")) ||
             (process.env.NEXT_PUBLIC_API_BASE || "/api");

function join(path: string) {
  // ensure no double slashes
  if (!path) return BASE;
  if (BASE.endsWith("/") && path.startsWith("/")) return BASE + path.slice(1);
  if (!BASE.endsWith("/") && !path.startsWith("/")) return BASE + "/" + path;
  return BASE + path;
}

async function request<T>(path: string, opts: RequestInit = {}) {
  const url = join(path);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return (await res.json()) as T;
}

/** Upload & format endpoint (POST multipart form) */
export async function formatFile(form: FormData) {
  const url = join("/format"); // backend endpoint should be /format (root)
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Format failed ${res.status}: ${body}`);
  }
  // if backend returns JSON with job info or download_url
  return res.json();
}

/** Jobs API */
export async function listJobs(): Promise<JobRecord[]> {
  return request<JobRecord[]>("/jobs");
}
export async function removeJob(id: string) {
  return request<void>(`/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export async function clearJobs() {
  return request<void>("/jobs/clear", { method: "POST" });
}
export async function getJob(id: string): Promise<JobRecord> {
  return request<JobRecord>(`/jobs/${encodeURIComponent(id)}`);
}
