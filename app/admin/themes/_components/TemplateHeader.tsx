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
  const [busy, setBusy]       = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(name);

  async function save() {
    if (!draft.trim() || draft.trim() === name) { setEditing(false); return; }
    setBusy(true);
    await fetch(`/api/admin/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.trim() }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div style={s.wrap}>
      {/* Breadcrumb */}
      <a href="/admin/themes" style={s.back}>
        <span style={s.backArrow}>←</span> Theme Studio
      </a>

      <div style={s.row}>
        {/* Name — click to edit inline */}
        <div style={s.nameArea}>
          {editing ? (
            <div style={s.editRow}>
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
                style={s.nameInput}
              />
              <button onClick={save} disabled={busy} style={s.saveBtn}>{busy ? "Saving…" : "Save"}</button>
              <button onClick={() => { setEditing(false); setDraft(name); }} style={s.cancelBtn}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} style={s.nameBtn} title="Click to rename">
              <h1 style={s.name}>{name}</h1>
              <span style={s.editHint}>Rename</span>
            </button>
          )}
        </div>

        {/* Package tags */}
        {packageNames.length > 0 && (
          <div style={s.tagRow}>
            {packageNames.map(p => (
              <span key={p} style={s.tag}>{p}</span>
            ))}
          </div>
        )}
        {packageNames.length === 0 && (
          <span style={s.noTags}>No packages assigned — <a href="/admin/themes" style={s.tagLink}>assign on template list</a></span>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: {
    marginBottom: "1.5rem",
    paddingBottom: "1.25rem",
    borderBottom: "1px solid var(--c-border)",
  },
  back: {
    display: "inline-flex", alignItems: "center", gap: "0.25rem",
    fontSize: "0.8125rem", color: "var(--c-muted)", textDecoration: "none",
    marginBottom: "0.75rem",
    transition: "color 0.15s",
  },
  backArrow: { fontSize: "0.9rem" },
  row:  { display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" as const },
  nameArea: { flex: 1, minWidth: 0 },

  /* Inline name edit */
  nameBtn: {
    background: "none", border: "none", padding: 0, cursor: "pointer",
    display: "flex", alignItems: "baseline", gap: "0.625rem",
    textAlign: "left" as const, width: "100%",
  },
  name:     { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)", lineHeight: 1.25 },
  editHint: { fontSize: "0.75rem", color: "var(--c-accent)", fontWeight: 600, opacity: 0.8, flexShrink: 0 },

  editRow: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" as const },
  nameInput: {
    fontSize: "1.25rem", fontWeight: 700, color: "var(--c-text)",
    border: "1px solid var(--c-accent)", borderRadius: 8,
    padding: "0.3rem 0.625rem", background: "var(--c-surface-2)",
    fontFamily: "inherit", flex: 1, minWidth: 200,
    outline: "none",
  },
  saveBtn: {
    padding: "0.35rem 0.875rem", background: "var(--c-accent)", color: "var(--c-lime-text)",
    border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600,
  },
  cancelBtn: {
    padding: "0.35rem 0.75rem", background: "transparent", color: "var(--c-muted)",
    border: "1px solid var(--c-border)", borderRadius: 7, cursor: "pointer", fontSize: "0.8125rem",
  },

  /* Package tags */
  tagRow: { display: "flex", gap: "0.375rem", flexWrap: "wrap" as const },
  tag:    { padding: "0.25rem 0.625rem", background: "var(--c-accent-soft)", color: "var(--c-accent)", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, border: "1px solid var(--c-border)" },
  noTags: { fontSize: "0.8125rem", color: "var(--c-muted)" },
  tagLink:{ color: "var(--c-accent)", textDecoration: "underline" },
} as const;
