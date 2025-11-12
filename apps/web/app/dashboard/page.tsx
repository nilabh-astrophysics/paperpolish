// apps/web/app/dashboard/page.tsx
"use client";

import React from "react";
import { listJobs as localList, removeJob, clearJobs, type JobRecord } from "../../lib/api";

export default function DashboardPage() {
  const [rows, setRows] = React.useState<JobRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const remote = await localList();
        setRows(remote);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function onRemove(id: string) {
    try {
      await removeJob(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (err: any) {
      setError(err?.message ?? "Delete failed");
    }
  }

  async function onClear() {
    try {
      await clearJobs();
      setRows([]);
    } catch (err: any) {
      setError(err?.message ?? "Clear failed");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", color: "white" }}>
      <h1>Dashboard — Jobs</h1>

      {loading ? (
        <div>Loading jobs…</div>
      ) : error ? (
        <div style={{ color: "salmon" }}>{error}</div>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            <button onClick={onClear} style={{ padding: "6px 10px", borderRadius: 6 }}>
              Clear all
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>ID</th>
                <th style={{ textAlign: "left", padding: 8 }}>File</th>
                <th style={{ textAlign: "left", padding: 8 }}>Created</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #333" }}>
                  <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{r.id}</td>
                  <td style={{ padding: 8 }}>{r.filename ?? "-"}</td>
                  <td style={{ padding: 8 }}>
                    {r.created_at ? new Date(r.created_at * 1000).toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => onRemove(r.id)} style={{ marginRight: 8 }}>
                      Delete
                    </button>
                    {r.download_url && (
                      <a href={r.download_url} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 12 }}>
                    No jobs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
