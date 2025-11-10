"use client";

import React from "react";
import { listJobs, removeJob, clearJobs, type JobRecord } from "../../lib/history";

export default function DashboardPage() {
  const [rows, setRows] = React.useState<JobRecord[]>([]);

  React.useEffect(() => setRows(listJobs()), []);

  const del = (id: string) => {
    removeJob(id);
    setRows(listJobs());
  };

  const clear = () => {
    if (!confirm("Clear all locally saved jobs?")) return;
    clearJobs();
    setRows([]);
  };

  return (
    <div className="wrap">
      <h1>Jobs & Downloads</h1>

      {rows.length === 0 ? (
        <div className="empty">No previous jobs yet. Upload a project first.</div>
      ) : (
        <>
          <div className="toolbar">
            <button className="ghost" onClick={() => setRows(listJobs())}>Refresh</button>
            <button className="danger" onClick={clear}>Clear All</button>
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
                  ) : (
                    "—"
                  )}
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
        .empty { opacity: 0.8; padding: 16px; border: 1px dashed #333; border-radius: 12px; }
        .toolbar { display: flex; gap: 10px; margin: 10px 0 14px; }
        .table { display: grid; gap: 6px; }
        .thead, .row {
          display: grid;
          grid-template-columns: 1.2fr 1.4fr 1fr 1.1fr 1.4fr 1.1fr;
          gap: 8px;
          align-items: center;
        }
        .thead { font-weight: 800; opacity: 0.9; padding: 4px 0; }
        .row {
          padding: 10px;
          border: 1px solid #222;
          border-radius: 12px;
          background: #0c0c0c;
        }
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
      `}</style>
    </div>
  );
}
