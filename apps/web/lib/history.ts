// apps/web/lib/history.ts
// Lightweight client-side job-history helpers used by dashboard/upload pages.
//
// Provides named exports: listJobs, listJobsLocal, saveJob, saveJobLocal,
// removeJob, clearJobs, saveJobRemote
// and a default export object for compatibility.

import type { JobRecord as APIJobRecord } from "./api";
import { listJobs as remoteListFn, createJob as remoteCreateJob } from "./api";

export type JobRecord = {
  id: string;
  filename?: string;
  template?: string;
  createdAt?: number | string;
  status?: string;
  size?: number;
  warnings?: string[];
  download_url?: string;
  output_path?: string;
  [k: string]: any;
};

const STORAGE_KEY = "paperpolish_jobs_v1";

/** Read local jobs from localStorage (client-only) */
export function listJobsLocal(): Record<string, JobRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, JobRecord>;
  } catch (err) {
    console.warn("history: could not parse local jobs", err);
    return {};
  }
}

/**
 * listJobs(mode)
 * - mode "local" returns localStorage jobs
 * - mode "remote" tries the backend listJobs() and falls back to local on error
 */
export async function listJobs(mode: "local" | "remote" = "local") {
  if (mode === "remote") {
    try {
      const remote = await remoteListFn();
      // remoteListFn may return an array or an object - normalise if needed
      if (Array.isArray(remote)) {
        // convert to id-keyed object for local UI convenience
        const asObj: Record<string, JobRecord> = {};
        for (const r of remote) {
          if (r && (r as any).id) asObj[(r as any).id] = r as JobRecord;
        }
        return asObj;
      }
      return remote;
    } catch (e) {
      console.warn("history: remote list failed, falling back to local", e);
      return listJobsLocal();
    }
  }
  return listJobsLocal();
}

/** Save job to localStorage */
export function saveJobLocal(job: JobRecord) {
  if (typeof window === "undefined") return;
  const jobs = listJobsLocal();
  jobs[job.id] = job;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (e) {
    console.warn("history: failed to save job locally", e);
  }
}

/** Remove one job from localStorage */
export function removeJob(id: string) {
  if (typeof window === "undefined") return;
  const jobs = listJobsLocal();
  if (jobs[id]) {
    delete jobs[id];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (e) {
      console.warn("history: failed to update localStorage after remove", e);
    }
  }
}

/** Clear all local jobs */
export function clearJobs() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("history: failed to clear jobs", e);
  }
}

/** Optionally push job to remote API; swallow errors (best-effort) */
export async function saveJobRemote(job: JobRecord | APIJobRecord) {
  try {
    const res = await remoteCreateJob(job as any);
    return res;
  } catch (e) {
    console.warn("history: remote save failed", e);
    return null;
  }
}

/** Combined helper: save locally then try remote */
export async function saveJob(job: JobRecord) {
  saveJobLocal(job);
  try {
    await saveJobRemote(job);
  } catch (e) {
    /* intentionally ignore remote failures */
  }
}

/* default export for modules that import default */
const _default = {
  listJobs,
  listJobsLocal,
  saveJob,
  saveJobLocal,
  saveJobRemote,
  removeJob,
  clearJobs,
};

export default _default;
