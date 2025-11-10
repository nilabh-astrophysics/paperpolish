// apps/web/lib/api.ts
//
// A tiny client helper that:
// - Reads API base from env
// - Provides XHR-based upload with progress callbacks (fetch has no upload progress)
// - Normalizes success + error messages

export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000")
    .replace(/\/+$/, "");

export type UploadResult = {
  job_id?: string;
  jobId?: string;
  zip_url?: string;
  warnings?: string[] | string;
};

export type FriendlyError = {
  title: string;
  message: string;
  details?: string;
  code?: string | number;
  raw?: any;
};

// Map common backend/API errors to friendly messages
export function toFriendlyError(err: unknown, responseBody?: any): FriendlyError {
  // Network / XHR failure
  if (err instanceof Error && err.name === "AbortError") {
    return {
      title: "Upload cancelled",
      message: "The upload was cancelled.",
      raw: err,
    };
  }
  if (err instanceof Error && (err.message?.includes("Network") || err.message?.includes("Failed to fetch"))) {
    return {
      title: "Network error",
      message: "We couldn't reach the server. Please check your connection and try again.",
      raw: err,
    };
  }

  // FastAPI-style errors or OpenAI errors
  const body = responseBody || (typeof err === "object" ? (err as any) : undefined);

  // OpenAI-style
  const maybeOpenAI = body?.detail?.error || body?.error;
  if (maybeOpenAI?.code === "invalid_api_key" || maybeOpenAI?.message?.includes("Incorrect API key")) {
    return {
      title: "AI key invalid",
      message:
        "Your AI grammar feature could not run because the OpenAI API key is invalid. Update your key in the backend.",
      details: "Error: invalid_api_key",
      raw: body,
    };
  }
  if (maybeOpenAI?.code === "insufficient_quota" || maybeOpenAI?.message?.includes("exceeded your current quota")) {
    return {
      title: "AI quota exceeded",
      message:
        "You've exceeded the OpenAI quota for AI grammar. Disable the AI option or top up the API account and try again.",
      details: "Error: insufficient_quota",
      raw: body,
    };
  }

  // FastAPI validation (422) and others
  const list = body?.detail;
  if (Array.isArray(list)) {
    const first = list[0];
    if (first?.type === "missing" || first?.msg?.toLowerCase().includes("required")) {
      return {
        title: "Missing file",
        message: "Please choose a .zip project or a .tex file before clicking Format.",
        code: 422,
        raw: body,
      };
    }
    return {
      title: "Validation error",
      message: first?.msg || "Please check your inputs and try again.",
      code: 422,
      raw: body,
    };
  }

  // Generic 4xx/5xx
  if (body?.message) {
    return {
      title: "Something went wrong",
      message: body.message,
      raw: body,
    };
  }

  return {
    title: "Unexpected error",
    message: "An unexpected error occurred. Please try again.",
    raw: err,
  };
}

// XHR upload with progress callback
export function uploadArchiveXHR(
  endpoint: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (signal) {
      const onAbort = () => {
        try {
          xhr.abort();
        } finally {
          signal.removeEventListener("abort", onAbort);
        }
      };
      signal.addEventListener("abort", onAbort);
    }

    xhr.open("POST", endpoint, true);

    xhr.upload.onprogress = (evt) => {
      if (!onProgress) return;
      if (evt.lengthComputable) {
        const pct = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;

      try {
        const contentType = xhr.getResponseHeader("content-type") || "";
        const isJson = contentType.includes("application/json");
        const body = isJson ? JSON.parse(xhr.responseText || "{}") : { message: xhr.responseText };

        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve(body as UploadResult);
        } else {
          reject({ status: xhr.status, body });
        }
      } catch (e) {
      // parsing or other errors
        reject({ status: xhr.status, body: xhr.responseText });
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

export function buildDownloadUrl(res: UploadResult): string | null {
  if (res.zip_url) return res.zip_url;
  const jobId = res.job_id || res.jobId;
  if (!jobId) return null;
  return `${API_BASE}/download/${jobId}`;
}
