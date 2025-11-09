"use client";
import { useCallback } from "react";

export default function FileDrop({ onFile }: { onFile: (f: File | null) => void }) {
  const onChange = useCallback((e: any) => onFile(e.target.files?.[0] ?? null), [onFile]);
  return (
    <div className="card" style={{ padding: 20 }}>
      <input type="file" onChange={onChange} accept=".zip,.tex" />
      <p className="kv" style={{ marginTop: 8 }}>
        Choose your LaTeX project (.zip) or a single .tex file.
      </p>
    </div>
  );
}
