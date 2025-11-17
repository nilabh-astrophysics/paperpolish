// lib/history.ts
export type JobRecord = {
  id: string;
  filename?: string;
  template?: string;
  // backend (snake_case) and frontend (camelCase) friendly fields
  download_url?: string;
  downloadUrl?: string;
  createdAt?: number | string;
  warnings?: string[];
  size?: number;
  options?: string[]; // stored from upload form
  [k: string]: any;
};

const KEY = "paperpolish:jobs:v1";

/** read raw jobs array from localStorage (returns [] if none or parse error) */
export function _readStorage(): JobRecord[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as JobRecord[];
  } catch {
    return [];
  }
}

/** write job array to localStorage safely */
export function _writeStorage(arr: JobRecord[]) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

/** Save a job (put at start of list). Accepts partial records. */
export function saveJob(job: Partial<JobRecord> & { id?: string }) {
  const id = job.id ?? String(Date.now());
  const now = Date.now();
  const j: JobRecord = {
    id,
    filename: job.filename ?? "Untitled",
    template: job.template,
    download_url: job.download_url ?? job.downloadUrl ?? (job as any).url,
    downloadUrl: job.downloadUrl ?? job.download_url ?? (job as any).url,
    createdAt: job.createdAt ?? now,
    warnings: job.warnings ?? [],
    size: job.size,
    options: job.options,
    ...job,
  };
  const arr = _readStorage();
  // remove existing with same id
  const filtered = arr.filter((x) => x.id !== id);
  filtered.unshift(j);
  // keep reasonable history length
  const keep = filtered.slice(0, 200);
  _writeStorage(keep);
}

/** Remove a job by id */
export function removeJob(id: string) {
  const arr = _readStorage();
  const filtered = arr.filter((x) => x.id !== id);
  _writeStorage(filtered);
}

/** Clear all saved jobs */
export function clearJobs() {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Synchronous list fetcher (keeps compatibility with code that expects sync or async) */
export function listJobs(): JobRecord[] {
  return _readStorage();
}

/** Async variant */
export async function listJobsAsync(): Promise<JobRecord[]> {
  return _readStorage();
}
