"use client";

import React, { useEffect, useState } from "react";
import { uploadArchive, waitHealthy } from "../../lib/api";
import TemplateSelect from "../../components/TemplateSelect";
import FileDrop from "../../components/FileDrop";
import { track, trackPageview } from "../../lib/analytics";

type UploadResult = {
  job_id: string;
  warnings: string[];
  download_url?: string;
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("aastex");
  const [options, setOptions] = useState<string[]>(["fix_citations"]);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    trackPageview("upload");
    // wake Render (free tier) quietly
    waitHealthy();
  }, []);

  function toggle(opt: string) {
    setOptions((v) => (v.includes(opt) ? v.filter((x) => x !== opt) : [...v, opt]));
  }

  async function onSubmit() {
    setError(null);
    setWarnings([]);
    setDownloadUrl(null);
    setJobId(null);

    track("format_click", { template, options: options.join(","), has_file: !!file });

    if (!file) {
      const msg = "Please upload a .zip project or a single .tex file.";
      setError(msg);
      track("format_error", { message: msg });
      return;
    }

    try {
      setLoading(true);

      const res: UploadResult = await uploadArchive({
        file,
        template,
        options,
      });

      setJobId(res.job_id);
      setWarnings(res.warnings || []);
      setDownloadUrl(res.download_url || null);

      track("format_success", {
        job_id: res.job_id,
        warnings: (res.warnings || []).length,
        template,
        options: options.join(","),
      });
    } catch (e: any) {
      const msg = e?.message || "Upload failed. Check API is running.";
      setError(msg);
      track("format_error", { message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <div className="card">
        <h1>Upload LaTeX Project</h1>

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <label className="kv" style={{ display: "block", marginBottom: 6 }}>
              Target template
            </label>
            <TemplateSelect value={template} onChange={setTemplate} />
          </div>

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <label>
              <input
                type="checkbox"
                checked={options.includes("fix_citations")}
                onChange={() => toggle("fix_citations")}
              />
              <span className="kv" style={{ marginLeft: 8 }}>Fix citations</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.includes("ai_grammar")}
                onChange={() => toggle("ai_grammar")}
              />
              <span className="kv" style={{ marginLeft: 8 }}>AI grammar (abstract)</span>
            </label>
          </div>

          <FileDrop onFile={setFile} />
          <div className="kv">
            Upload a <code>.zip</code> (project) or a single <code>.tex</code>
          </div>

          <div>
            <button className="btn" onClick={onSubmit} disabled={loading}>
              {loading ? <span className="spinner" aria-hidden /> : null}
              {loading ? "Formatting…" : "Format"}
            </button>
          </div>

          {error && <div className="alert alert-err">{error}</div>}

          {warnings.length > 0 && (
            <div className="alert alert-warn">
              <strong>Warnings</strong>
              <ul style={{ margin: "6px 0 0 18px" }}>
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {downloadUrl && (
            <div className="card" style={{ background: "transparent", borderColor: "#2c333a" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Your formatted project is ready
              </div>
              <div className="kv" style={{ marginBottom: 10 }}>Job ID: {jobId}</div>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="btn"
                aria-label="Download formatted ZIP"
                onClick={() => track("download_click", { job_id: jobId })}
              >
                Download ZIP
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
