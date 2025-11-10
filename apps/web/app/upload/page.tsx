"use client";

import React from "react";
import {
  API_BASE,
  uploadArchiveXHR,
  toFriendlyError,
  buildDownloadUrl,
} from "../../lib/api"; // 👈 use relative import (for Vercel)

type OptionKey = "fix_citations" | "ai_grammar";

const TEMPLATES = [
  { value: "aastex", label: "AAS Journals (aastex)" },
  { value: "ieee", label: "IEEE (IEEEtran)" },
  { value: "elsevier", label: "Elsevier (elsarticle)" },
];

export default function UploadPage() {
  const [template, setTemplate] = React.useState<string>(TEMPLATES[0].value);

  // ✅ Properly typed Set<OptionKey> initialization
  const [options, setOptions] = React.useState<Set<OptionKey>>(
    () => new Set<OptionKey>(["fix_citations"])
  );

  const [file, setFile] = React.useState<File | null>(null);
  const [stage, setStage] = React.useState<
    "idle" | "uploading" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = React.useState<number>(0);
  const [error, setError] = React.useState<{
    title: string;
    message: string;
    details?: string;
  } | null>(null);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);

  const abortRef = React.useRef<AbortController | null>(null);

  // --- Handlers -----------------------------------------------------

  const toggle = (key: OptionKey) => {
    setOptions((curr) => {
      const next = new Set<OptionKey>(curr);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onFile = (f: File | null) => {
    setFile(f);
    setError(null);
    setDownloadUrl(null);
    setWarnings([]);
    setStage("idle");
    setProgress(0);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError({
        title: "No file selected",
        message: "Please choose a .zip project or a single .tex file.",
      });
      return;
    }

    setError(null);
    setStage("uploading");
    setProgress(1);

    const form = new FormData();
    form.append("archive", file);
    form.append("template", template);
    form.append("options", Array.from(options).join(",")); // send options

    // Cancel any previous upload
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const endpoint = `${API_BASE}/format`;
      const res = await uploadArchiveXHR(
        endpoint,
        form,
        (pct) => setProgress(pct),
        abortRef.current.signal
      );

      const url = buildDownloadUrl(res);
      setDownloadUrl(url);
      const warn =
        (Array.isArray(res.warnings)
          ? res.warnings
          : res.warnings
          ? [res.warnings]
          : []) as string[];
      setWarnings(warn);

      setStage("processing");
      setTimeout(() => setStage("done"), 350);
    } catch (err: any) {
      const friendly = toFriendlyError(err, err?.body);
      setError({
        title: friendly.title,
        message: friendly.message,
        details: friendly.details,
      });
      setStage("error");
      setProgress(0);
    }
  }

  const reset = () => {
    setFile(null);
    setDownloadUrl(null);
    setWarnings([]);
    setProgress(0);
    setError(null);
    setStage("idle");
  };

  // --- UI -----------------------------------------------------------

  return (
    <div
      className="container"
      style={{ maxWidth: 880, margin: "0 auto", padding: "32px 16px" }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Upload LaTeX Project
      </h1>

      {/* Template selector */}
      <div style={{ marginBottom: 16 }}>
        <label
          htmlFor="tpl"
          style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
        >
          Target template
        </label>
        <select
          id="tpl"
          className="kv"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            background: "#111",
            border: "1px solid #333",
          }}
        >
          {TEMPLATES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Options */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={options.has("fix_citations")}
            onChange={() => toggle("fix_citations")}
          />
          <span className="kv">Fix citations</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={options.has("ai_grammar")}
            onChange={() => toggle("ai_grammar")}
          />
          <span className="kv">AI grammar (abstract)</span>
        </label>
      </div>

      {/* File input */}
      <div
        style={{
          marginTop: 12,
          padding: 16,
          border: "1px dashed #333",
          borderRadius: 12,
          background: "#0a0a0a",
        }}
      >
        <p className="kv" style={{ marginBottom: 8 }}>
          Choose your LaTeX project (.zip) or a single .tex file.
        </p>
        <input
          type="file"
          accept=".zip,.tex"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        {file && (
          <div className="kv" style={{ marginTop: 10, opacity: 0.8 }}>
            Selected: <strong>{file.name}</strong>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {stage === "uploading" && (
        <div style={{ marginTop: 16 }}>
          <div className="kv" style={{ marginBottom: 6 }}>
            Uploading… {progress}%
          </div>
          <div
            style={{
              width: "100%",
              height: 10,
              background: "#1e1e1e",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "inset 0 0 0 1px #262626",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg,#6ee7b7,#3b82f6)",
                transition: "width .15s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Processing */}
      {stage === "processing" && (
        <div className="kv" style={{ marginTop: 16, opacity: 0.9 }}>
          Processing… almost there.
        </div>
      )}

      {/* Error state */}
      {stage === "error" && error && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: "12px 14px",
            borderRadius: 12,
            background: "#2a1313",
            color: "#fca5a5",
            border: "1px solid #7f1d1d",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{error.title}</div>
          <div>{error.message}</div>
          {error.details && (
            <div className="kv" style={{ marginTop: 6, opacity: 0.8 }}>
              {error.details}
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && stage === "done" && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            borderRadius: 12,
            background: "#1d2433",
            color: "#93c5fd",
            border: "1px solid #1e3a8a",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Warnings</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {warnings.map((w, i) => (
              <li key={i} className="kv">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success */}
      {stage === "done" && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            background: "#0f1f17",
            border: "1px solid #14532d",
          }}
        >
          <div className="kv" style={{ marginBottom: 12 }}>
            ✅ Your formatted project is ready.
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {downloadUrl && (
              <a
                className="btn"
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background:
                    "linear-gradient(90deg,rgba(34,197,94,0.9),rgba(59,130,246,0.9))",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Download ZIP
              </a>
            )}
            <button
              className="btn"
              onClick={reset}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#1f2937",
                color: "#e5e7eb",
                fontWeight: 600,
                border: "1px solid #374151",
              }}
            >
              Format another
            </button>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div style={{ marginTop: 18 }}>
        <button
          className="btn"
          onClick={onSubmit}
          disabled={stage === "uploading" || !file}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: !file ? "#2a2a2a" : "#2563eb",
            color: "white",
            fontWeight: 700,
            opacity: stage === "uploading" ? 0.7 : 1,
            cursor: stage === "uploading" ? "not-allowed" : "pointer",
          }}
        >
          {stage === "uploading" ? `Uploading… ${progress}%` : "Format"}
        </button>
      </div>

      <style jsx global>{`
        .kv {
          color: #d4d4d8;
        }
        .btn:focus {
          outline: 2px solid #60a5fa;
          outline-offset: 2px;
        }
        select,
        input[type="file"] {
          color: #e5e7eb;
        }
        input[type="checkbox"] {
          transform: translateY(1px);
        }
      `}</style>
    </div>
  );
}

