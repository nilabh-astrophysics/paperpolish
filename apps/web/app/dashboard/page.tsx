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
    async function load() {
      try {
        // Try backend first
        const remote = await remoteList();
        setRows(remote);
      } catch (err) {
        console.warn("Remote /jobs failed, falling back to localStorage", err);
        try {
          setRows(localList());
        } catch {
          setError("Couldn't load jobs from either backend or local storage.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const del = (id: string) => {
    removeJob(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const clear = () => {
    if (!confirm("Clear all locally saved jobs?")) return;
    clearJobs();
    setRows([]);
  };

  return (
    <div className="wrap">
      <h1>Jobs & Downloads</h1>

      {loading && <div className="subtle">Loading jobs…</div>}
      {error && <div className="alert error">{error}</div>}

      {!loading && rows.length === 0 && (
        <div className="empty">
          No previous jobs yet. Upload a project on the{" "}
          <a href="/upload" className="link">Upload</a> page.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="toolbar">
            <a className="ghost" href="/upload">New job</a>
            <button className="ghost" onClick={() => window.location.reload()}>
              Refresh
            </button>
            <button className="danger" onClick={clear}>
              Clear Local
            </button>
          </div>

          <div className="table">
            <div className="thead">
              <div>When</div>
              <div>File</div>
              <div>Template</div>
              <div>Options</div>
              <div>Warnings</div>
              <div>Actions</div>
            </div>

            {rows.map((r) => (
              <div className="row" key={r.id}>
                <div>{new Date(r.createdAt).toLocaleString()}</div>
                <div title={r.filename || ""}>
                  {r.filename ?? "—"} {r.size ? `(${(r.size / 1024).toFixed(1)} KB)` : ""}
                </div>
                <div>{r.template}</div>
                <div>{r.options.join(", ") || "—"}</div>
                <div>
                  {r.warnings?.length ? (
                    <details>
                      <summary>{r.warnings.length} warning(s)</summary>
                      <ul>
                        {r.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </details>
                  ) : "—"}
                </div>
                <div className="actions">
                  <a className="btn" href={r.downloadUrl} target="_blank" rel="noreferrer">
                    Download
                  </a>
                  <button className="ghost" onClick={() => del(r.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .wrap { max-width: 960px; margin: 0 auto; padding: 32px 16px; }
        h1 { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .link { color: #93c5fd; text-decoration: underline; }
        .empty { opacity: 0.85; padding: 16px; border: 1px dashed #333; border-radius: 12px; }
        .toolbar { display: flex; gap: 10px; margin: 12px 0 16px; flex-wrap: wrap; }
        .table { display: grid; gap: 6px; }
        .thead, .row {
          display: grid;
          grid-template-columns: 1.2fr 1.4fr 1fr 1.1fr 1.4fr 1.1fr;
          gap: 8px;
          align-items: center;
        }
        .thead { font-weight: 800; opacity: 0.9; padding: 4px 0; }
        .row { padding: 10px; border: 1px solid #222; border-radius: 12px; background: #0c0c0c; }
        .actions { display: flex; gap: 8px; align-items: center; }
        .btn {
          padding: 8px 12px; border-radius: 10px; border: none;
          background: #2563eb; color: #fff; font-weight: 700; cursor: pointer;
        }
        .ghost {
          padding: 7px 10px; border-radius: 10px; background: #1f2937;
          color: #e5e7eb; font-weight: 600; border: 1px solid #374151; cursor: pointer;
        }
        .danger {
          padding: 7px 10px; border-radius: 10px; background: #7f1d1d;
          color: #fde8e8; font-weight: 700; border: 1px solid #b91c1c; cursor: pointer;
        }
        .subtle { opacity: 0.8; margin-bottom: 12px; }
        .alert.error {
          background: #2a1313; color: #fca5a5;
          border: 1px solid #7f1d1d; border-radius: 10px;
          padding: 10px 14px; margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
