// apps/web/lib/api.ts

// ====== Config ======
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

// ====== Types ======
export type FormatResponse = {
  job_id: string;
  warnings?: string[] | string;
  // optional extras your API may include
  filename?: string;
  status?: string;
};

type UploadProgressFn = (percent: number) => void;

// ====== Helpers ======
export function buildDownloadUrl(res: Pick<FormatResponse, "job_id"> | { job_id: string }) {
  const id = res.job_id;
  return `${API_BASE}/download/${encodeURIComponent(id)}`;
}

export function toFriendlyError(err: any, body?: any): {
  title: string;
  message: string;
  details?: string;
  status?: number;
} {
  // Normalize response bodies that might be JSON or text
  const status = err?.status ?? body?.status ?? err?.response?.status;
  const detail =
    body?.detail ??
    body?.message ??
    err?.response?.data?.detail ??
    err?.message ??
    "Unexpected error";

  let title = "Request failed";
  if (status && status >= 500) title = "Server error";
  else if (status && status >= 400) title = "Request error";

  // Specialized hints
  let message = String(detail);
  if (typeof detail !== "string") {
    try {
      message = JSON.stringify(detail);
    } catch {
      message = "Unexpected error";
    }
  }

  // Common front-end debugging hint
  if (String(message).toLowerCase().includes("fetch") || status === 0) {
    message += " (Check NEXT_PUBLIC_API_URL and your API CORS settings)";
  }

  return { title, message, details: typeof body === "string" ? body : undefined, status };
}

// XHR upload to allow granular progress updates and abort()
export function uploadArchiveXHR<T = any>(
  url: string,
  form: FormData,
  onProgress?: UploadProgressFn,
  signal?: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url, true);

    xhr.upload.onprogress = (evt) => {
      if (!onProgress || !evt.lengthComputable) return;
      const pct = Math.max(1, Math.min(99, Math.round((evt.loaded / evt.total) * 100)));
      onProgress(pct);
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;

      const contentType = xhr.getResponseHeader("Content-Type") || "";
      const status = xhr.status;

      let data: any = xhr.responseText;
      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(xhr.responseText || "{}");
        } catch {
          // ignore
        }
      }

      if (status >= 200 && status < 300) {
        // Force 100% on success
        if (onProgress) onProgress(100);
        resolve(data as T);
      } else {
        // Attach status + parsed body for nicer UI messages
        const error: any = new Error(
          data?.detail || data?.message || `Upload failed with status ${status}`
        );
        error.status = status;
        error.body = data;
        reject(error);
      }
    };

    xhr.onerror = () => {
      const error: any = new Error("Network error");
      error.status = 0;
      reject(error);
    };

    if (signal) {
      signal.addEventListener("abort", () => {
        try {
          xhr.abort();
        } catch {}
        const error: any = new Error("Upload aborted");
        error.status = 0;
        reject(error);
      });
    }

    xhr.send(form);
  });
}

// ====== Jobs API (backend persistence) ======
export async function listJobs() {
  const res = await fetch(`${API_BASE}/jobs`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw { status: res.status, message: "Jobs list failed", body: text };
  }
  return res.json();
}

export async function createJob(job: {
  id: string;
  createdAt: number;
  filename?: string;
  size?: number;
  template: string;
  options: string[];
  warnings?: string[];
  download_url: string;
}) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw { status: res.status, message: "Job save failed", body };
  }
  return res.json();
}

// (Optional) simple health check helper
export async function health() {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  return res.ok ? res.json() : { ok: false, status: res.status };
}
