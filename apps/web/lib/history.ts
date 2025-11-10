// apps/web/lib/history.ts

export type JobRecord = {
  id: string;                // job_id from backend
  template: string;
  options: string[];         // ["fix_citations", "ai_grammar"]
  createdAt: number;
  filename?: string;
  size?: number;
  warnings?: string[];
  downloadUrl: string;
};

const KEY = "pp.jobs";

function read(): JobRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as JobRecord[]) : [];
  } catch {
    return [];
  }
}

function write(list: JobRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function addJob(rec: JobRecord) {
  const list = read();
  list.unshift(rec);
  write(list.slice(0, 50)); // keep last 50
}

export function listJobs(): JobRecord[] {
  return read();
}

export function removeJob(id: string) {
  write(read().filter((j) => j.id !== id));
}

export function clearJobs() {
  write([]);
}
