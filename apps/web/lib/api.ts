// apps/web/lib/api.ts
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

const API_BASE = "/api"; // <-- RELATIVE path for Option A

async function request<T>(path: string, opts: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

/** upload & format route: expects FormData with file and options */
export async function formatFile(form: FormData) {
  const res = await fetch(`${API_BASE}/format`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Format failed ${res.status}: ${body}`);
  }
  return res.json();
}

/** jobs endpoints */
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
