"use client";

import React from "react";
import FileDrop from "../../components/FileDrop";
import {
  API_BASE,
  uploadArchiveXHR,
  toFriendlyError,
  buildDownloadUrl,
  type FormatResponse,
} from "../../lib/api";
import { addJob } from "../../lib/history";

type OptionKey = "fix_citations" | "ai_grammar";
type Stage = "idle" | "uploading" | "processing" | "done" | "error";

const TEMPLATES = [
  { value: "aastex", label: "AAS Journals (aastex)" },
  { value: "ieee", label: "IEEE (IEEEtran)" },
  { value: "elsevier", label: "Elsevier (elsarticle)" },
];

function humanize(err: any): { title: string; message: string; details?: string } {
  // Map common server statuses
  const status = err?.status || err?.body?.status;
  if (status === 413) {
    return {
      title: "File too large",
      message: "Max upload size is 25 MB. Please split the project or upload a smaller file.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many requests",
      message: "You’ve hit the rate limit. Please try again in a minute.",
    };
  }
  const friendly = toFriendlyError(err, err?.body);
  return {
    title: friendly.title,
    message: friendly.message,
    details: friendly.details,
  };
}

function optionBadges(options: Set<OptionKey>) {
  const labels: Record<OptionKey, string> = {
    fix_citations: "Citations fixed",
    ai_grammar: "AI grammar (abstract)",
  };
  return Array.from(options).map((k) => labels[k]);
}

export default function UploadPage() {
  const [template, setTemplate] = React.useState<string>(TEMPLATES[0].value);
  const [options, setOptions] = React.useState<Set<OptionKey>>(
    () => new Set<OptionKey>(["fix_citations"])
  );
  const [file, setFile] = React.useState<File | null>(null);

  const [stage, setStage] = React.useState<Stage>("idle");
  const [progress, setProgress] = React.useState<number>(0);
  const [error, setError] = React.useState<{ title: string; message: string; details?: string } | null>(null);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const abortRef = React.useRef<AbortController | null>(null);

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
      setError({ title: "No file selected", message: "Please choose a .zip project or a .tex file." });
      return;
    }

    setError(null);
    setStage("uploading");
    setProgress(1);

    const form = new FormData();
    form.append("archive", file);
    form.append("template", template);
    form.append("options", Array.from(options).join(","));

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const endpoint = `${API_BASE}/format`;
      const res = await uploadArchiveXHR<FormatResponse>(
        endpoint,
        form,
        (pct) => setProgress(pct),
        controller.signal
      );

      const url = buildDownloadUrl(res);
      setDownloadUrl(url);

      const warn =
        (Array.isArray(res.warnings) ? res.warnings : res.warnings ? [res.warnings] : []) as string[];
      setWarnings(warn);

      addJob({
        id: res.job_id,
        template,
        options: Array.from(options),
        createdAt: Date.now(),
        filename: file.name,
        size: file.size,
        warnings: warn,
        downloadUrl: url,
      });

      setStage("processing");
      setTimeout(() => setStage("done"), 350);
    } catch (err: any) {
      setError(humanize(err));
      setStage("error");
      setProgress(0);
    }
  }

  const cancelUpload = () => {
    if (stage === "uploading") abortRef.current?.abort();
  };

  const reset = () => {
    setFile(null);
    setDownloadUrl(null);
    setWarnings([]);
    setProgress(0);
    setError(null);
    setStage("idle");
  };

  return (
    <div className="wrap">
      <h1>Upload LaTeX Project</h1>

      {/* Template */}
      <div className="field">
        <label htmlFor="tpl">Target template</label>
        <select id="tpl" value={template} onChange={(e) => setTemplate(e.target.value)}>
          {TEMPLATES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Options */}
      <div className="row">
        <label className="check">
          <input
            type="checkbox"
            checked={options.has("fix_citations")}
            onChange={() => toggle("fix_citations")}
          />
          <span>Fix citations</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={options.has("ai_grammar")}
            onChange={() => toggle("ai_grammar")}
          />
          <span>AI grammar (abstract)</span>
        </label>
      </div>

      {/* Drag-and-drop */}
      <FileDrop
        onFile={onFile}
        accept=".zip,.tex"
        label="Upload a .zip (project) or a single .tex"
        note={file ? `Selected: ${file.name}` : "Drag & drop here, or choose a file."}
        maxSizeBytes={25 * 1024 * 1024}
      />

      {/* Progress + cancel */}
      {stage === "uploading" && (
        <div className="progressWrap" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="progressBar">
            <div className="bar" style={{ width: `${progress}%` }}>
              <div className="stripes" />
            </div>
          </div>
          <div className="progressMeta">
            <span>Uploading… {progress}%</span>
            <button className="ghost" onClick={cancelUpload} type="button" aria-label="Cancel upload">
              Cancel
            </button>
          </div>
        </div>
      )}

      {stage === "processing" && <div className="subtle">Processing… almost there.</div>}

      {/* Error */}
      {stage === "error" && error && (
        <div className="alert error" role="alert">
          <div className="title">{error.title}</div>
          <div>{error.message}</div>
          {error.details && <pre className="details">{error.details}</pre>}
          <div className="rowBtns" style={{ marginTop: 10 }}>
            <button className="ghost" onClick={reset} type="button">Try again</button>
            <a className="ghost" href="/dashboard">Open dashboard</a>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && stage === "done" && (
        <div className="alert warn">
          <div className="title">Warnings</div>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success */}
      {stage === "done" && (
        <div className="success">
          <div className="kv" style={{ marginBottom: 10 }}>✅ Your formatted project is ready.</div>
          <div className="badges">
            <span className="badge">{TEMPLATES.find(t => t.value === template)?.label || template}</span>
            {optionBadges(options).map((b, i) => (
              <span key={i} className="badge">{b}</span>
            ))}
          </div>
          <div className="rowBtns" style={{ marginTop: 12 }}>
            {downloadUrl && (
              <a className="btn" href={downloadUrl} target="_blank" rel="noreferrer">
                Download ZIP
              </a>
            )}
            <a className="ghost" href="/dashboard">View in Dashboard</a>
            <button className="ghost" onClick={reset} type="button">Format another</button>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="actions">
        <button className="btn" onClick={onSubmit} disabled={stage === "uploading" || !file}>
          {stage === "uploading" ? `Uploading… ${progress}%` : "Format"}
        </button>
      </div>

      <style jsx>{`
        .wrap { max-width: 880px; margin: 0 auto; padding: 32px 16px; }
        h1 { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .field { margin: 0 0 16px; }
        label { font-weight: 600; display: block; margin: 0 0 6px; }
        select { width: 100%; padding: 10px; border-radius: 10px; background: #0c0c0c; color: #e6e6e6; border: 1px solid #2a2a2a; }
        .row { display: flex; gap: 24px; align-items: center; margin: 8px 0 6px; flex-wrap: wrap; }
        .check { display: inline-flex; gap: 8px; align-items: center; color: #d4d4d8; }
        .progressWrap { margin-top: 16px; }
        .progressBar { width: 100%; height: 12px; background: #151515; border-radius: 999px; overflow: hidden; box-shadow: inset 0 0 0 1px #262626; }
        .bar { height: 100%; position: relative; background: linear-gradient(90deg, #4ade80, #60a5fa); transition: width 120ms ease; }
        .stripes { position: absolute; inset: 0; background-image: linear-gradient(45deg, rgba(255,255,255,.18) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.18) 75%, transparent 75%, transparent); background-size: 22px 22px; animation: move .8s linear infinite; opacity: .6; }
        @keyframes move { from { background-position: 0 0; } to { background-position: 22px 0; } }
        .progressMeta { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; color: #d4d4d8; }
        .subtle { margin-top: 16px; opacity: .9; color: #d4d4d8; }
        .alert { margin-top: 16px; padding: 12px 14px; border-radius: 12px; border: 1px solid; }
        .alert.error { background: #2a1313; color: #fca5a5; border-color: #7f1d1d; }
        .alert.warn { background: #1d2433; color: #93c5fd; border-color: #1e3a8a; }
        .alert .title { font-weight: 700; margin-bottom: 6px; }
        .details { margin-top: 8px; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace; font-size: 12px; opacity: .85; }
        .success { margin-top: 16px; padding: 16px; border-radius: 12px; background: #0f1f17; border: 1px solid #14532d; color: #d4d4d8; }
        .rowBtns { display: flex; gap: 10px; flex-wrap: wrap; }
        .actions { margin-top: 18px; }
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; background: #2563eb; color: #fff; font-weight: 700; border: none; cursor: pointer; }
        .btn:disabled { opacity: .7; cursor: not-allowed; }
        .ghost { padding: 9px 12px; border-radius: 10px; background: #1f2937; color: #e5e7eb; font-weight: 600; border: 1px solid #374151; cursor: pointer; }
        .badges { display: flex; gap: 8px; flex-wrap: wrap; }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font-size: 12px; background: #0b1f15; color: #a7f3d0; border: 1px solid #14532d; }
        .kv { color: #d4d4d8; }
      `}</style>
    </div>
  );
}
