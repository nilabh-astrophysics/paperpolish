// apps/web/app/dashboard/page.tsx
"use client";
import React from "react";
import { listJobs as localList, removeJob, clearJobs, type JobRecord } from "../../lib/history";
import { listJobs as remoteList } from "../../lib/api";

export default function DashboardPage() {
  const [rows, setRows] = React.useState<JobRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (typeof remoteList === "function") {
          const maybe = remoteList();
          const resolved = await Promise.resolve(maybe);
          const remoteRows = Array.isArray(resolved) ? (resolved as JobRecord[]) : [];
          if (mounted) {
            setRows(remoteRows.length ? remoteRows : localList());
            setLoading(false);
            return;
          }
        }
      } catch {}
      if (mounted) {
        setRows(localList());
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const del = (id: string) => { removeJob(id); setRows(localList()); };
  const clr = () => { clearJobs(); setRows([]); };

  if (loading) return <div>Loading…</div>;
  if (!rows.length) return <div>No jobs</div>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <div style={{ display: "grid", gap: 12 }}>
        {rows.map(r => {
          const url = (r as any).downloadUrl ?? (r as any).download_url ?? null;
          return (
            <div key={r.id} style={{ border: "1px solid #ccc", padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{r.filename}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{r.template} • {(r.createdAt ? new Date(r.createdAt).toLocaleString() : "")}</div>
              <div style={{ marginTop: 8 }}>
                {url && <a href={url} target="_blank" rel="noreferrer">Download</a>}
                <button onClick={() => del(r.id)} style={{ marginLeft: 8 }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}><button onClick={clr}>Clear all</button></div>
    </main>
  );
}
