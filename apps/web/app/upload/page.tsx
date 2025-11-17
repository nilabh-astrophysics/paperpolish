// apps/web/app/upload/page.tsx
"use client";

import React from "react";
import { uploadArchive } from "../../../lib/api";
import FileDrop from "../../../components/FileDrop";
import { saveJob } from "../../../lib/history";

type OptionKey = "fix_citations" | "ai_grammar";

const TEMPLATES = [
  { value: "aastex", label: "AAS Journals (aastex)" },
  { value: "ieee", label: "IEEE (IEEEtran)" },
  { value: "elsarticle", label: "Elsevier (elsarticle)" },
];

export default function UploadPage() {
  const [template, setTemplate] = React.useState<string>(TEMPLATES[0].value);
  const [options, setOptions] = React.useState<Set<OptionKey>>(new Set(["fix_citations"]));
  const [file, setFile] = React.useState<File | null>(null);

  const [stage, setStage] = React.useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [progress, setProgress] = React.useState<number>(0);

  React.useEffect(() => {
    if (stage === "idle" || stage === "done" || stage === "error") {
      setProgress(0);
      return;
    }
    setProgress(10);
    const id = setInterval(() => setProgress((p) => (p < 90 ? p + 5 : p)), 400);
    return () => clearInterval(id);
  }, [stage]);

  const toggle = (k: OptionKey) => {
    const next = new Set(options);
    next.has(k) ? next.delete(k) : next.add(k);
    setOptions(next);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarnings([]);
    setDownloadUrl(null);

    if (!file) {
      setError("Please choose a .zip project or a single .tex file to continue.");
      return;
    }

    try {
      setStage("uploading");
      const result = await uploadArchive(file, template, Array.from(options));
      // backend expected shape: { job_id, warnings, download_url } or similar
      const url = result?.download_url ?? result?.downloadUrl ?? result?.url ?? null;
      const warns: string[] = result?.warnings ?? result?.warns ?? [];

      setStage("processing");
      setProgress(96);

      const job = {
        id: result?.job_id ?? result?.jobId ?? String(Date.now()),
        download_url: url,
        downloadUrl: url ?? undefined,
        template,
        options: Array.from(options),
        warnings: warns ?? [],
        filename: file.name,
        size: file.size,
        createdAt: Date.now(),
      };

      // save both snake_case and camelCase to local history
      saveJob(job);

      setWarnings(warns ?? []);
      setDownloadUrl(url);
      setStage("done");
      setProgress(100);
    } catch (err: any) {
      let msg = "Something went wrong. Please try again.";
      const text = String(err?.message || err);

      if (/413/.test(text)) msg = "File too large. Please upload a smaller project.";
      else if (/429/.test(text)) msg = "Rate limited. Try again shortly.";
      else if (/network|fetch|Failed to fetch/i.test(text)) msg = "Couldn't reach the server. Check your network or API URL.";
      else if (/401|invalid_api_key/i.test(text)) msg = "Authorization error. Check API keys.";

      setError(msg);
      setStage("error");
    }
  }

  const disabled = stage === "uploading" || stage === "processing";

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Upload LaTeX Project</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ minWidth: 120 }}>Target template</span>
          <select value={template} onChange={(e) => setTemplate(e.target.value)} disabled={disabled} style={{ padding: 8, borderRadius: 8 }}>
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={options.has("fix_citations")} onChange={() => toggle("fix_citations")} disabled={disabled} />
            <span>Fix citations</span>
          </label>

          <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={options.has("ai_grammar")} onChange={() => toggle("ai_grammar")} disabled={disabled} />
            <span>AI grammar (abstract)</span>
          </label>
        </div>

        <FileDrop onFile={setFile}>
          <div>Upload a <code>.zip</code> (project) or a single <code>.tex</code></div>
          {file && <div style={{ marginTop: 8, color: "#bbb" }}>Selected: {file.name}</div>}
        </FileDrop>

        {disabled && (
          <div style={{ marginTop: 6 }}>
            <div style={{ height: 12, background: "#0b0b0b", border: "1px solid #222", borderRadius: 10, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress}%`, background: "#2563eb", borderRadius: 9, transition: "width .3s" }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12 }}>{stage === "uploading" ? "Uploading…" : "Processing…"}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
          <button className="btn" type="submit" disabled={disabled} style={{ padding: "10px 14px", borderRadius: 10, background: "#2563eb", color: "#fff", fontWeight: 700 }}>
            {stage === "uploading" || stage === "processing" ? "Working…" : "Format"}
          </button>
          <a href="/dashboard" style={{ padding: "9px 12px", borderRadius: 10, background: "#111827", color: "#e5e7eb", textDecoration: "none" }}>
            See jobs
          </a>
        </div>

        {error && <div style={{ padding: 10, borderRadius: 10, background: "#7f1d1d", color: "#fde8e8" }}>{error}</div>}

        {stage === "done" && downloadUrl && (
          <div style={{ borderRadius: 12, padding: 14, background: "#0b1a0f", border: "1px solid #123" }}>
            <div style={{ fontWeight: 800 }}>Your formatted project is ready</div>

            {warnings.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <strong>Warnings</strong>
                <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            )}

            <a href={downloadUrl} style={{ display: "inline-block", marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#2563eb", color: "#fff", textDecoration: "none" }}>
              Download ZIP
            </a>

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>Saved to your Dashboard too.</div>
          </div>
        )}
      </form>
    </div>
  );
}
