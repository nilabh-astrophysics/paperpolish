// apps/web/app/upload/page.tsx
"use client";
import React from "react";
import { uploadArchive } from "../../lib/api";
import FileDrop from "../../components/FileDrop";
import { saveJob } from "../../lib/history";

const TEMPLATES = [
  { value: "aastex", label: "AAS Journals (aastex)" },
  { value: "ieee", label: "IEEE (IEEEtran)" },
];

export default function UploadPage() {
  const [template, setTemplate] = React.useState(TEMPLATES[0].value);
  const [file, setFile] = React.useState<File | null>(null);
  const [state, setState] = React.useState<"idle" | "working" | "done" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!file) return setErr("Choose a file");
    setState("working");
    try {
      const res = await uploadArchive(file, template, []);
      const url = res?.download_url ?? res?.downloadUrl ?? null;
      saveJob({
        id: res?.job_id ?? String(Date.now()),
        filename: file.name,
        template,
        download_url: url,
        downloadUrl: url,
        warnings: res?.warnings ?? [],
      });
      setDownloadUrl(url);
      setState("done");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setState("error");
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Upload</h1>
      <form onSubmit={submit}>
        <div>
          <select value={template} onChange={(e) => setTemplate(e.target.value)}>
            {TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <FileDrop onFile={setFile}>
          <div>Choose .zip or .tex</div>
        </FileDrop>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={state === "working"}>Format</button>
        </div>
        {err && <div style={{ color: "red" }}>{err}</div>}
        {downloadUrl && <a href={downloadUrl} target="_blank" rel="noreferrer">Download</a>}
      </form>
    </main>
  );
}
