// apps/web/lib/api.ts

// Read once and normalize (no trailing slash)
export const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");

export type OptionKey = "fix_citations" | "ai_grammar";

export type FormatStage = "idle" | "uploading" | "processing" | "done" | "error";

export type FormatResponse = {
  job_id: string;
  warnings?: string[] | string;
};

export function buildDownloadUrl(res: FormatResponse): string {
  // Backend provides a download endpoint: GET /download/{job_id}
  return `${API_BASE}/download/${res.job_id}`;
}

/**
 * Upload using XHR so we can track progress and support AbortController.
 */
export function uploadArchiveXHR<T extends Record<string, any>>(
  url: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
  abortSignal?: AbortSignal
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Allow external cancellation
    const onAbort = () => {
      try {
        xhr.abort();
      } catch {}
      reject(new DOMException("Upload aborted", "AbortError"));
    };
    if (abortSignal) {
      if (abortSignal.aborted) return onAbort();
      abortSignal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.open("POST", url, true);

    xhr.upload.onprogress = (evt) => {
      if (!onProgress) return;
      if (evt.lengthComputable) {
        const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
        onProgress(pct);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;
      // cleanup abort listener
      if (abortSignal) abortSignal.removeEventListener("abort", onAbort);

      const contentType = xhr.getResponseHeader("content-type") || "";
      const isJSON = contentType.includes("application/json");

      if (xhr.status >= 200 && xhr.status < 300) {
        if (isJSON) {
          try {
            resolve(JSON.parse(xhr.responseText));
            return;
          } catch (e) {
            reject(new Error("Invalid JSON from server."));
            return;
          }
        }
        // If server didn't return JSON, still resolve with a shell object
        // (Not expected for this API, but keeps things resilient)
        // @ts-expect-error – fallback shape
        resolve({ ok: true, body: xhr.responseText });
      } else {
        let body: any = xhr.responseText;
        if (isJSON) {
          try {
            body = JSON.parse(xhr.responseText);
          } catch {}
        }
        const err: any = new Error(`HTTP ${xhr.status}`);
        err.status = xhr.status;
        err.body = body;
        reject(err);
      }
    };

    xhr.onerror = () => {
      const err: any = new Error("Network error");
      err.status = 0;
      reject(err);
    };

    xhr.send(formData);
  });
}

/**
 * Best-effort user-friendly error for FastAPI responses.
 */
export function toFriendlyError(err: any, payload?: any): {
  title: string;
  message: string;
  details?: string;
} {
  // Abort?
  if (err?.name === "AbortError") {
    return {
      title: "Upload canceled",
      message: "You canceled the upload.",
    };
  }

  // FastAPI standard error body: { detail: ... }
  const detail = payload?.detail ?? err?.body?.detail;

  if (typeof detail === "string") {
    return { title: "Request failed", message: detail };
  }

  if (Array.isArray(detail)) {
    // Validation error array
    const first = detail[0];
    if (first?.msg) {
      return { title: "Validation error", message: first.msg, details: JSON.stringify(detail) };
    }
  }

  // OpenAI errors (when AI grammar used)
  const maybeOpenAI = payload?.error?.message || err?.body?.error?.message;
  if (maybeOpenAI) {
    return { title: "AI service error", message: maybeOpenAI };
  }

  if (err?.status) {
    return {
      title: `Server error (${err.status})`,
      message: "The server could not complete your request.",
      details: typeof payload === "string" ? payload : JSON.stringify(payload || {}, null, 2),
    };
  }

  return { title: "Network error", message: "Please check your connection and try again." };
}
