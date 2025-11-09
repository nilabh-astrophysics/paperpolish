// apps/web/lib/api.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://localhost:8000";

/** Optional: wake the free Render dyno */
export async function waitHealthy(timeoutMs = 2500) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

type UploadBody = {
  file: File;
  template: string;
  options: string[];
};

type UploadResult = {
  job_id: string;
  warnings: string[];
  download_url?: string;
};

export async function uploadArchive({
  file,
  template,
  options,
}: UploadBody): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("archive", file);                 // <-- must be "archive"
  fd.append("template", template);
  fd.append("options", options.join(","));   // backend expects comma-separated

  const res = await fetch(`${API_BASE}/format`, {
    method: "POST",
    body: fd,                                // <-- no Content-Type header
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Upload failed (${res.status}).`);
  }

  const data = (await res.json()) as UploadResult;
  // convenience download URL
  data.download_url = `${API_BASE}/download/${data.job_id}`;
  return data;
}

