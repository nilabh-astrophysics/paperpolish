// app/dashboard/page.tsx
"use client";

import React from "react";
import {
  listJobs as localList,
  removeJob,
  clearJobs,
  type JobRecord,
} from "../../lib/history";
import { listJobs as remoteList } from "../../lib/api";

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
        // Prefer remote backend if available and working
        if (typeof remoteList === "function") {
          try {
            const maybe = (remoteList as any)();
            const remoteRows: JobRecord[] =
              maybe && typeof (maybe as any).then === "function"
                ? await (maybe as Promise<JobRecord[]>)
                : (maybe as JobRecord[]);

            if (mounted && Array.isArray(remoteRows) && remoteRows.length >= 0) {
              setRows(remoteRows);
              setLoading(false);
              return;
            }
          } catch {
            // ignore remote errors and fall back to local
          }
        }

        // Local list (support both sync and async implementations)
        const maybeLocal = (localList as any)();
        if (maybeLocal && typeof (maybeLocal as any).then === "function") {
          const list = await (maybeLocal as Promise<JobRecord[]>);
          if (mounted) setRows(list);
        } else {
          if (mounted) setRows(maybeLocal as JobRecord[]);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message ?? String(err));
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
    // Refresh rows from local storage (handle sync/async)
    try {
      const maybe = (localList as any)();
      if (maybe && typeof (maybe as any).then === "function") {
        (maybe as Promise<JobRecord[]>).then((list) => setRows(list));
      } else {
        setRows(maybe as JobRecord[]);
      }
    } catch {
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
          {rows.map((r) => {
            // Support both snake_case and camelCase download fields
            const url = (r as any).downloadUrl ?? (r as any).download_url;

            return (
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
                  <div style={{ fontWeight: 600 }}>{r.filename || "Untitled"}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                    {" • "}
                    {r.template || ""}
                  </div>
                  {r.warnings && r.warnings.length > 0 && (
                    <div style={{ color: "orange", fontSize: 12 }}>
                      {r.warnings.length} warnings
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "6px 10px",
                        background: "#0b74ff",
                        color: "#fff",
                        borderRadius: 6,
                        textDecoration: "none",
                      }}
                    >
                      Download
                    </a>
                  ) : null}

                  <button onClick={() => del(r.id)} style={{ padding: "6px 10px" }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
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
