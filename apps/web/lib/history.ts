// apps/web/lib/history.ts

export type JobRecord = {
  id: string;                // job_id from backend
  template: string;
  options: string[];         // ["fix_citations", "ai_grammar"]
  createdAt: number;         // ms epoch
  filename?: string;
  size?: number;             // in bytes
  warnings?: string[];
  downloadUrl: string;       // built from API response
};

const KEY = "pp.jobs";

function safeParse(raw: string | null): JobRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as JobRecord[];
    return [];
  } catch {
    return [];
  }
}

function read(): JobRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY));
}

function write(list: JobRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
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

