// apps/web/lib/history.ts
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

const KEY = "paperpolish:jobs:v1";

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

export function _writeStorage(arr: JobRecord[]) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
}

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
  const filtered = arr.filter((x) => x.id !== id);
  filtered.unshift(j);
  _writeStorage(filtered.slice(0, 200));
}

export function removeJob(id: string) {
  const arr = _readStorage();
  _writeStorage(arr.filter((x) => x.id !== id));
}

export function clearJobs() {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
  } catch {}
}

export function listJobs(): JobRecord[] {
  return _readStorage();
}
export async function listJobsAsync(): Promise<JobRecord[]> {
  return _readStorage();
}
