"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  name: string;
  packageNames: string[];
}

export function TemplateHeader({ id, name, packageNames }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function rename() {
    const next = window.prompt("Rename template:", name);
    if (!next || !next.trim() || next.trim() === name) return;
    setBusy(true);
    await fetch(`/api/admin/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: next.trim() }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={s.wrap}>
      <div>
        <a href="/admin/themes" style={s.back}>← All templates</a>
        <div style={s.titleRow}>
          <h1 style={s.title}>{name}</h1>
          <button onClick={rename} disabled={busy} style={s.renameBtn}>Rename</button>
        </div>
        <p style={s.sub}>
          {packageNames.length > 0
            ? <>Allowed for: {packageNames.join(", ")}</>
            : <>Not tagged to any package yet — set tags on the Theme Builder list.</>}
        </p>
      </div>
    </div>
  );
}

const s = {
  wrap: { marginBottom: "1.25rem" },
  back: { display: "inline-block", fontSize: "0.875rem", color: "var(--c-muted)", textDecoration: "none", marginBottom: "0.375rem" },
  titleRow: { display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" as const },
  title: { margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" },
  renameBtn: { padding: "0.3rem 0.75rem", background: "var(--c-surface)", color: "var(--c-text)", border: "1px solid var(--c-border)", borderRadius: 7, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 },
  sub: { margin: 0, fontSize: "0.875rem", color: "var(--c-muted)" },
} as const;
