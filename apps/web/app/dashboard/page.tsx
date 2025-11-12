"use client";

import React from "react";
import {
  listJobs as localList,
  removeJob,
  clearJobs,
  type JobRecord,
} from "../../lib/history";
import { listJobs as remoteList } from "../../lib/api"; // optional remote loader

export default function DashboardPage() {
  const [rows, setRows] = React.useState<JobRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Try remote backend first (if implemented)
        if (typeof remoteList === "function") {
          try {
            const maybe = (remoteList as any)();
            let remoteRows: JobRecord[] | null = null;

            if (maybe && typeof (maybe as any).then === "function") {
              // remoteList is async
              remoteRows = await (maybe as Promise<JobRecord[]>);
            } else {
              // remoteList returned synchronously
              remoteRows = maybe as JobRecord[];
            }

            if (mounted && Array.isArray(remoteRows) && remoteRows.length) {
              setRows(remoteRows);
              setLoading(false);
              return;
            }
          } catch (err) {
            // remote failed — fall back to local
            // console.warn("remote list failed", err);
          }
        }

        // Fallback to local history
        const maybeLocal = (localList as any)();
        if (maybeLocal && typeof (maybeLocal as any).then === "function") {
          const list = await (maybeLocal as Promise<JobRecord[]>);
          if (mounted) setRows(list);
        } else {
          if (mounted) setRows(maybeLocal as JobRecord[]);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const del = (id: string) => {
    removeJob(id);
    // update UI from local storage
    try {
      const maybe = (localList as any)();
      if (maybe && typeof (maybe as any).then === "function") {
        (maybe as Promise<JobRecord[]>).then((list) => setRows(list));
      } else {
        setRows(maybe as JobRecord[]);
      }
    } catch {
      // fallback: filter state
      setRows((r) => r.filter((x) => x.id !== id));
    }
  };

  const clearAll = () => {
    clearJobs();
    setRows([]);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: "salmon" }}>Error: {error}</div>
      ) : rows.length === 0 ? (
        <div>No jobs yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #333",
                padding: 12,
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: "600" }}>{r.filename || "Untitled"}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>
                  {new Date(r.createdAt).toLocaleString()} • {r.template || ""}
                </div>
                {r.warnings && r.warnings.length > 0 && (
                  <div style={{ color: "orange", fontSize: 12 }}>
                    {r.warnings.length} warnings
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {r.downloadUrl ? (
                  <a
                    href={r.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "6px 10px", background: "#0b74ff", color: "#fff", borderRadius: 6, textDecoration: "none" }}
                  >
                    Download
                  </a>
                ) : null}

                <button onClick={() => del(r.id)} style={{ padding: "6px 10px" }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button onClick={clearAll} disabled={rows.length === 0}>
          Clear all
        </button>
      </div>
    </main>
  );
}
