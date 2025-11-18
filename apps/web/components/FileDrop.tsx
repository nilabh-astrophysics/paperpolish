// apps/web/components/FileDrop.tsx
import React from "react";

export default function FileDrop({ children, onFile }: { children?: React.ReactNode; onFile: (f: File | null) => void }) {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    onFile(file);
  };
  return (
    <div style={{ border: "2px dashed #444", padding: 18, borderRadius: 8 }}>
      <input type="file" onChange={handle} accept=".zip,.tex" />
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}
