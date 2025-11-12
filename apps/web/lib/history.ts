// apps/web/lib/history.ts
// Lightweight history helpers used by dashboard / upload pages.
// Provides named exports: listJobs, saveJob, removeJob, clearJobs

export type JobRecord = {
  id: string;
  createdAt: number;
  filename: string;
  size?: number;
  template?: string;
  options?: string[]; // e.g. ["fix_citations"]
  warnings?: string[];
  status?: string; // free-form: "queued", "processing", "done", "error"
  download_url?: string | null;
};

const LS_KEY = "paperpolish:jobs:v1";

/** Read list from localStorage (safely). */
function readLocal(): JobRecord[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
  } catch (e) {
    // ignore parse errors
  }
  return [];
}

/** Write list to localStorage (safely). */
function writeLocal(list: JobRecord[]) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    // ignore quota errors etc.
  }
}

/**
 * listJobs - return the list of jobs stored locally.
 * Keep the API async so consumers can await remote or local uniformly.
 */
export async function listJobs(): Promise<JobRecord[]> {
  // small copy defensive
  const arr = readLocal();
  // newest first
  return arr.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * saveJob - add or replace a job record in local storage.
 * If a job with the same id exists, it will be replaced.
 */
export async function saveJob(job: JobRecord): Promise<JobRecord> {
  const list = readLocal();
  const idx = list.findIndex((j) => j.id === job.id);
  if (idx >= 0) list[idx] = job;
  else list.push(job);
  writeLocal(list);
  return job;
}

/**
 * removeJob - remove a job by id
 */
export async function removeJob(id: string): Promise<void> {
  const list = readLocal().filter((j) => j.id !== id);
  writeLocal(list);
}

/**
 * clearJobs - delete all local jobs
 */
export async function clearJobs(): Promise<void> {
  writeLocal([]);
}

