"use client";

import React from "react";
import { uploadArchive } from "../../lib/api";
import FileDrop from "../../components/FileDrop";
import { saveJob } from "../../lib/history";

type OptionKey = "fix_citations" | "ai_grammar";

const TEMPLATES = [
  { value: "aastex", label: "AAS Journals (aastex)" },
  { value: "ieee", label: "IEEE (IEEEtran)" },
  { value: "elsarticle", label: "Elsevier (elsarticle)" },
];

type Stage = "idle" | "uploading" | "processing" | "done" | "error";

export default function UploadPage() {
  const [template, setTemplate] = React.useState<string>(TEMPLATES[0].value);
  const [options, setOptions] = React.useState<Set<OptionKey>>(new Set(["fix_citations"]));
  const [file, setFile] = React.useState<File | null>(null);

  const [stage, setStage] = React.useState<Stage>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [progress, setProgress] = React.useState<number>(0);

  React.useEffect(() => {
    if (stage === "idle" || stage === "done" || stage === "error") { setProgress(0); return; }
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

    if (!file) { setError("Please choose a .zip project or a single .tex file to continue."); return; }

    try {
      setStage("uploading");
      const { url, warnings: warns } = await uploadArchive(file, template, Array.from(options));
      setStage("processing");
      setProgress(96);

      const job = {
        downloadUrl: url,
        template,
        options: Array.from(options),
        warnings: warns ?? [],
        filename: file.name,
        size: file.size,
      };
      saveJob(job);

      setWarnings(warns ?? []);
      setDownloadUrl(url);
      setStage("done");
      setProgress(100);
    } catch (err: any) {
      let msg = "Something went wrong. Please try again.";
      const text = String(err?.message || err);

      if (/413/.test(text)) msg = "File too large. Please upload a project under the limit.";
      else if (/429/.test(text)) msg = "We’re getting a lot of traffic. Please retry in ~1–2 minutes.";
      else if (/network|fetch|Failed to fetch/i.test(text)) msg = "Couldn’t reach the server. Check your internet or try again shortly.";
      else if (/invalid_api_key|401/.test(text)) msg = "AI grammar is off because the OpenAI key is invalid/disabled.";

      setError(msg);
      setStage("error");
    }
  }

  const disabled = stage === "uploading" || stage === "processing";

  return (
    <div className="wrap">
      <h1>Upload LaTeX Project</h1>

      <form onSubmit={onSubmit} className="card">
        <label className="kv">
          <span>Target template</span>
          <select value={template} onChange={(e) => setTemplate(e.target.value)} disabled={disabled}>
            {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        <div className="options">
          <label>
            <input
              type="checkbox"
              checked={options.has("fix_citations")}
              onChange={() => toggle("fix_citations")}
              disabled={disabled}
            />
            <span className="kv">Fix citations</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={options.has("ai_grammar")}
              onChange={() => toggle("ai_grammar")}
              disabled={disabled}
            />
            <span className="kv">AI grammar (abstract)</span>
          </label>
        </div>

        <FileDrop onFile={setFile}>
          Upload a <code>.zip</code> (project) or a single <code>.tex</code>
        </FileDrop>

        {disabled && (
          <div className="progress">
            <div className="bar" style={{ width: `${progress}%` }} />
            <div className="label">
              {stage === "uploading" ? "Uploading…" : "Processing…"}
            </div>
          </div>
        )}

        <div className="actions">
          <button className="btn" type="submit" disabled={disabled}>
            {stage === "uploading" || stage === "processing" ? "Working…" : "Format"}
          </button>
          <a className="ghost" href="/dashboard">See jobs</a>
        </div>

        {error && <div className="alert err">{error}</div>}

        {stage === "done" && downloadUrl && (
          <div className="success">
            <div className="title">Your formatted project is ready</div>
            {warnings.length > 0 && (
              <div className="warns">
                <strong>Warnings</strong>
                <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            )}
            <a className="btn" href={downloadUrl}>Download ZIP</a>
            <span className="hint">Saved to your Dashboard too.</span>
          </div>
        )}
      </form>

      <style jsx>{`
        .wrap { max-width: 840px; margin: 0 auto; padding: 32px 16px; }
        h1 { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .card { display: grid; gap: 14px; }
        .kv { display: inline-flex; gap: 8px; align-items: center; }
        select { background:#0b0b0b; border:1px solid #2a2a2a; padding:8px 10px; border-radius: 10px; color:#e5e7eb; }
        .options { display: flex; gap: 18px; align-items: center; margin: 6px 0 8px; }
        .actions { display: flex; gap: 10px; align-items: center; }
        .btn { padding: 10px 14px; border-radius: 10px; background: #2563eb; color: white; font-weight: 800; border: none; cursor: pointer; }
        .ghost { padding: 9px 12px; border-radius: 10px; background: #1f2937; color: #e5e7eb; border: 1px solid #374151; }
        .alert.err { padding: 10px 12px; border-radius: 10px; background: #7f1d1d; border: 1px solid #b91c1c; color: #fde8e8; }
        .progress { margin-top: 6px; border: 1px solid #2a2a2a; border-radius: 10px; position: relative; height: 12px; background:#0b0b0b; }
        .bar { position: absolute; left:0; top:0; bottom:0; background:#2563eb; border-radius: 9px; transition: width .3s ease; }
        .label { margin-top: 6px; font-size: 12px; opacity: .85; }
        .success { border:1px solid #1f3a22; background:#0b1a0f; padding:14px; border-radius:12px; display:grid; gap:10px; }
        .success .title { font-weight: 800; }
        .success .hint { font-size: 12px; opacity:.7; margin-left: 8px; }
        .warns ul { margin: 6px 0 0 18px; }
      `}</style>
    </div>
  );
}
