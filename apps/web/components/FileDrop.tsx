"use client";

import React from "react";

type Props = {
  onFile: (file: File | null) => void;
  accept?: string; // e.g. ".zip,.tex"
  label?: string;
  note?: string;
  maxSizeBytes?: number; // optional: enforce size here too
};

const DEFAULT_MAX = 25 * 1024 * 1024; // 25 MB

export default function FileDrop({
  onFile,
  accept = ".zip,.tex",
  label,
  note,
  maxSizeBytes = DEFAULT_MAX,
}: Props) {
  const [dragOver, setDragOver] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function validateFile(f: File) {
    if (!/(\.zip|\.tex)$/i.test(f.name)) {
      throw new Error("Please upload a .zip project or a single .tex file.");
    }
    if (f.size > maxSizeBytes) {
      const mb = Math.round((maxSizeBytes / (1024 * 1024)) * 10) / 10;
      throw new Error(`File too large (max ${mb} MB). Consider splitting the project.`);
    }
  }

  const handle = (f: File | null) => {
    try {
      setErr(null);
      if (f) validateFile(f);
      onFile(f);
    } catch (e: any) {
      setErr(e?.message || "Invalid file.");
      onFile(null);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    handle(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) {
      const f = e.dataTransfer.files[0];
      handle(f);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div>
      <div
        className={`drop ${dragOver ? "drag" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="group"
        aria-label="Drag and drop file area"
      >
        <div className="row">
          <div className="txt">
            <div className="headline">{label ?? "Upload a .zip (project) or a single .tex"}</div>
            <div className="sub">{note ?? "Drag & drop here, or choose a file."}</div>
          </div>
          <button
            className="btn"
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Select file"
          >
            Choose File
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          style={{ display: "none" }}
        />
      </div>

      {err && (
        <div
          role="alert"
          style={{
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#2a1313",
            color: "#fca5a5",
            border: "1px solid #7f1d1d",
          }}
        >
          {err}
        </div>
      )}

      <style jsx>{`
        .drop {
          margin: 12px 0 0;
          padding: 18px;
          border: 2px dashed #333;
          border-radius: 14px;
          background: #0a0a0a;
          transition: border-color 120ms ease, background 120ms ease;
        }
        .drop.drag {
          border-color: #60a5fa;
          background: #0b1020;
        }
        .row {
          display: flex;
          align-items: center;
          gap: 16px;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .headline {
          font-weight: 800;
          margin-bottom: 4px;
        }
        .sub {
          opacity: 0.85;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: 10px;
          background: #2563eb;
          color: #fff;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
