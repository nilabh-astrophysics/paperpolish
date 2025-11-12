// apps/web/lib/history.ts
/* lightweight client-side job history + helpers used by dashboard page */

import { listJobs as remoteListFn, createJob as remoteCreateJob } from "./api";

export type JobRecord = {
  id: string;
  filename?: string;
  template?: string;
  createdAt?: number | string;
  status?: string;
  output_path?: string;
  download_url?: string;
  [k: string]: any;
};

const STORAGE_KEY = "paperpolish_jobs_v1";

/** read local jobs from localStorage (client side only) */
export function listJobsLocal(): Record<string, JobRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, JobRecord>;
  } catch (e) {
    console.warn("history: could not parse local jobs", e);
    return {};
  }
}

/** listJobs: accept optional mode 'local' or 'remote' - remote uses API listJobs */
export async function listJobs(mode: "local" | "remote" = "local") {
  if (mode === "remote") {
    try {
      const remote = await remoteListFn();
      return remote;
    } catch (e) {
      console.warn("history: remote list failed", e);
      // fall back to local
      return listJobsLocal();
    }
  }
  return listJobsLocal();
}

export function saveJobLocal(job: JobRecord) {
  if (typeof window === "undefined") return;
  const jobs = listJobsLocal();
  jobs[job.id] = job;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

/** remove job from local storage */
export function removeJobLocal(id: string) {
  if (typeof window === "undefined") return;
  const jobs = listJobsLocal();
  delete jobs[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

/** clear all local jobs */
export function clearJobsLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** optionally persist job to remote server if available */
export async function saveJobRemote(job: JobRecord) {
  try {
    const res = await remoteCreateJob(job as any);
    return res;
  } catch (e) {
    console.warn("history: remote save failed", e);
    return null;
  }
}

/** combined save helper used by the upload page */
export async function saveJob(job: JobRecord) {
  saveJobLocal(job);
  try {
    await saveJobRemote(job);
  } catch (_) {
    // ignore
  }
}

/** exports used by dashboard/upload pages */
export { listJobs as listJobsFromLocal as listJobsLocal }; // named alias if some imports expect it
export default {
  listJobs,
  listJobsLocal,
  saveJob,
  saveJobLocal,
  removeJobLocal,
  clearJobsLocal,
  saveJobRemote,
};
