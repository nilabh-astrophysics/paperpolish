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

function baseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_FULL || "";
  return env.replace(/\/$/, "");
}

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

export async function uploadArchive(file: File, template = "aastex", options: string[] = []): Promise<any> {
  const b = baseUrl();
  const url = (b ? `${b}` : "") + "/api/format";
  const form = new FormData();
  form.append("file", file);
  form.append("template", template);
  form.append("options", options.join(","));

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`uploadArchive failed: ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json();
}
