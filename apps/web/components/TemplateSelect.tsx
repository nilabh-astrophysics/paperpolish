// apps/web/components/TemplateSelect.tsx
"use client";
import React from "react";

type Option = { value: string; label: string };

const OPTIONS: Option[] = [
  { value: "aastex",   label: "AAS Journals (aastex)" },
  { value: "ieee",     label: "IEEE (IEEEtran)" },
  { value: "elsevier", label: "Elsevier (elsarticle)" },
  // add more later…
];

interface TemplateSelectProps {
  value: string;
  onChange: (v: string) => void;
}

export default function TemplateSelect({ value, onChange }: TemplateSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: 6, width: "100%" }}
      aria-label="Target template"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
