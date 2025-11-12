// apps/web/app/upload/page.tsx
"use client";

import React, { useState } from "react";
import { formatFile } from "../../lib/api"; // relative path from app/upload to lib

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  async function onSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose a .zip or .tex file first.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    // if you show options checkboxes add them here:
    // fd.append("fix_citations", String(fixCitations));

    setLoading(true);
    setResult(null);
    try {
      const data = await formatFile(fd);
      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "2rem auto", color: "white" }}>
      <h1>Upload LaTeX Project</h1>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Choose file (.zip or .tex)
          </label>
          <input
            type="file"
            accept=".zip,.tex"
            onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
          />
        </div>

        <div style={{ margin: "1rem 0" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "8px 14px",
              border: "none",
              borderRadius: 6,
            }}
          >
            {loading ? "Formatting…" : "Format"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#3f1d1d", padding: 12, borderRadius: 8 }}>
            <strong>Request error</strong>
            <div style={{ marginTop: 6 }}>{error}</div>
            <div style={{ marginTop: 8 }}>
              <button type="button" onClick={() => { setError(null); }}>
                Try again
              </button>
            </div>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 12, background: "#0b2f1b", padding: 12, borderRadius: 8 }}>
            <strong>Success</strong>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
            {/* If the API returns download_url, show it */}
            {result?.download_url && (
              <div style={{ marginTop: 8 }}>
                <a href={result.download_url} target="_blank" rel="noreferrer">
                  Download result
                </a>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
