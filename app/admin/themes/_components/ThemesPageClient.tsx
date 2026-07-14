"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TemplateRow {
  id: string;
  name: string;
  isActive: boolean;
  coverUrl: string | null;
  backgroundUrl: string | null;
  thumbnailUrl: string | null;
  overlayConfig: Record<string, unknown> | null;
  packageIds: string[];
}
interface PackageRow { id: string; name: string; slug: string }
interface BuiltinTheme { id: string; name: string; palette: { bg: string; primary: string; accent: string; text: string } }
interface Props { templates: TemplateRow[]; packages: PackageRow[]; builtinThemes?: BuiltinTheme[] }

function paletteOf(overlay: Record<string, unknown> | null): string[] {
  const draft = (overlay?.builderDraft ?? {}) as Record<string, unknown>;
  const cover   = (draft.coverBg   ?? {}) as Record<string, unknown>;
  const content = (draft.contentBg ?? {}) as Record<string, unknown>;
  const block   = (Array.isArray(draft.coverBlocks) ? draft.coverBlocks[0] : {}) as Record<string, unknown>;
  return [
    (cover.color   as string) || "#1b2430",
    (content.color as string) || "#11151c",
    (block.color   as string) || "#ffffff",
  ];
}

export function ThemesPageClient({ templates, packages, builtinThemes = [] }: Props) {
  const router = useRouter();
  const [creating,       setCreating]       = useState(false);
  const [busyId,         setBusyId]         = useState<string | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null);
  const [nameModal,      setNameModal]      = useState(false);
  const [newName,        setNewName]        = useState("New Template");
  const [createError,    setCreateError]    = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameModal) {
      setNewName("New Template");
      setCreateError("");
      setTimeout(() => nameInputRef.current?.select(), 50);
    }
  }, [nameModal]);

  async function submitCreate() {
    if (!newName.trim()) { setCreateError("Please enter a name."); return; }
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);
    if (!res.ok) { setCreateError("Failed to create — please try again."); return; }
    const { template } = await res.json() as { template: { id: string } };
    setNameModal(false);
    router.push(`/admin/themes/${template.id}`);
  }

  function openModal() { setNameModal(true); }

  async function toggleActive(t: TemplateRow) {
    setBusyId(t.id);
    await fetch(`/api/admin/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(t: TemplateRow) {
    setBusyId(t.id);
    await fetch(`/api/admin/templates/${t.id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmDelete(null);
    router.refresh();
  }

  async function togglePackage(t: TemplateRow, packageId: string) {
    const next = t.packageIds.includes(packageId)
      ? t.packageIds.filter(p => p !== packageId)
      : [...t.packageIds, packageId];
    setBusyId(t.id);
    await fetch(`/api/admin/templates/${t.id}/packages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageIds: next }),
    });
    setBusyId(null);
    router.refresh();
  }

  const active   = templates.filter(t => t.isActive).length;
  const inactive = templates.length - active;

  return (
    <div style={s.page}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.heading}>Theme Studio</h1>
          <p style={s.sub}>Build reusable templates from base themes and assign them to pricing packages.</p>
        </div>
        <div style={s.headRight}>
          {templates.length > 0 && (
            <div style={s.stats}>
              <span style={s.statItem}><span style={{ ...s.dot, background: "#22c55e" }} />{active} active</span>
              {inactive > 0 && <span style={s.statItem}><span style={{ ...s.dot, background: "var(--c-border)" }} />{inactive} draft</span>}
            </div>
          )}
          <button onClick={openModal} disabled={creating} style={s.newBtn}>
            {creating ? "Creating…" : "+ New Template"}
          </button>
        </div>
      </div>

      {/* ── Built-in code themes ─────────────────────────────────── */}
      {builtinThemes.length > 0 && (
        <div style={s.builtinWrap}>
          <div style={s.builtinHead}>
            <div>
              <h2 style={s.builtinTitle}>Built-in themes</h2>
              <p style={s.builtinSub}>
                Bespoke coded designs, fully database-driven. Apply one to an event from its <b>Theme editor</b> — content, images and colors sync live.
              </p>
            </div>
          </div>
          <div style={s.builtinRow}>
            {builtinThemes.map(t => (
              <div key={t.id} style={s.builtinCard}>
                <span style={{ ...s.builtinSwatch, background: `linear-gradient(135deg, ${t.palette.primary} 0%, ${t.palette.accent} 100%)` }}>
                  <span style={{ color: t.palette.bg, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: "1.1rem" }}>Aa</span>
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={s.builtinName}>{t.name}</div>
                  <div style={s.builtinId}>{t.id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {templates.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🎨</div>
          <div style={s.emptyTitle}>No templates yet</div>
          <p style={s.emptySub}>Create your first template to start building reusable invitation themes for your packages.</p>
          <button onClick={openModal} disabled={creating} style={s.newBtn}>
            {creating ? "Creating…" : "+ Create first template"}
          </button>
        </div>
      ) : (

        /* ── Template grid ───────────────────────────────────────── */
        <div style={s.grid}>

          {/* "New" card — always first */}
          <button onClick={openModal} disabled={creating} style={s.newCard}>
            <div style={s.newPlus}>{creating ? "…" : "+"}</div>
            <div style={s.newLabel}>{creating ? "Creating…" : "New Template"}</div>
          </button>

          {templates.map(t => {
            const [c1, c2, c3] = paletteOf(t.overlayConfig);
            const img     = t.thumbnailUrl || t.coverUrl || t.backgroundUrl;
            const busy    = busyId === t.id;
            const delMode = confirmDelete === t.id;

            return (
              <div key={t.id} style={{ ...s.card, opacity: t.isActive ? 1 : 0.7 }}>

                {/* Portrait preview ──────────────────────────────── */}
                <a href={`/admin/themes/${t.id}`} style={s.thumb}>
                  {img
                    ? <img src={img} alt={t.name} style={s.thumbImg} />
                    : (
                      <div style={{ ...s.swatch, background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)` }}>
                        <span style={{ color: c3, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: "2.2rem", opacity: 0.75 }}>Aa</span>
                      </div>
                    )
                  }
                  {/* Status dot */}
                  <span style={{ ...s.statusDot, background: t.isActive ? "#22c55e" : "var(--c-muted)" }}
                        title={t.isActive ? "Active" : "Draft"} />
                  {/* Edit overlay on hover */}
                  <div style={s.thumbOverlay}>
                    <span style={s.thumbOverlayLabel}>Edit design</span>
                  </div>
                </a>

                {/* Card body ─────────────────────────────────────── */}
                <div style={s.body}>

                  {/* Name + badge */}
                  <div style={s.nameRow}>
                    <a href={`/admin/themes/${t.id}`} style={s.name} title={t.name}>{t.name}</a>
                    <span style={{ ...s.badge, ...(t.isActive ? s.badgeOn : s.badgeOff) }}>
                      {t.isActive ? "Active" : "Draft"}
                    </span>
                  </div>

                  {/* Package chips */}
                  {packages.length > 0 && (
                    <div>
                      <div style={s.pkgLabel}>Packages</div>
                      <div style={s.pkgRow}>
                        {packages.map(p => {
                          const on = t.packageIds.includes(p.id);
                          return (
                            <button key={p.id} type="button" disabled={busy}
                              onClick={() => togglePackage(t, p.id)}
                              style={{ ...s.chip, ...(on ? s.chipOn : {}) }}
                              title={on ? `Remove from ${p.name}` : `Add to ${p.name}`}>
                              {on && <span style={s.chipCheck}>✓</span>}{p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions / delete confirm */}
                  {delMode ? (
                    <div style={s.delConfirmBox}>
                      <p style={s.delWarning}>Delete &ldquo;{t.name}&rdquo;?</p>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => remove(t)} disabled={busy} style={s.delYesBtn}>
                          {busy ? "Deleting…" : "Delete"}
                        </button>
                        <button onClick={() => setConfirmDelete(null)} style={s.delNoBtn}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={s.actions}>
                      <a href={`/admin/themes/${t.id}`} style={s.editBtn}>Edit →</a>
                      <button onClick={() => toggleActive(t)} disabled={busy} style={s.ghostBtn}>
                        {t.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => setConfirmDelete(t.id)} disabled={busy} style={s.delBtn}>✕</button>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Name modal ───────────────────────────────────────────── */}
      {nameModal && (
        <div style={s.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) setNameModal(false); }}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitle}>New Template</h2>
                <p style={s.modalSub}>Give this template a name to get started.</p>
              </div>
              <button onClick={() => setNameModal(false)} style={s.modalClose} aria-label="Close">✕</button>
            </div>

            <div style={s.modalBody}>
              <label style={s.modalLabel}>Template name</label>
              <input
                ref={nameInputRef}
                value={newName}
                onChange={e => { setNewName(e.target.value); setCreateError(""); }}
                onKeyDown={e => { if (e.key === "Enter") submitCreate(); if (e.key === "Escape") setNameModal(false); }}
                placeholder="e.g. Golden Khmer, Rose Garden…"
                style={s.modalInput}
                maxLength={80}
              />
              {createError && <p style={s.modalErr}>{createError}</p>}
            </div>

            <div style={s.modalFooter}>
              <button onClick={() => setNameModal(false)} style={s.modalCancelBtn}>Cancel</button>
              <button onClick={submitCreate} disabled={creating || !newName.trim()} style={{ ...s.modalCreateBtn, opacity: creating || !newName.trim() ? 0.5 : 1 }}>
                {creating ? "Creating…" : "Create Template →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────────── */
const s = {
  page: { padding: "0" },

  /* built-in code themes */
  builtinWrap:   { border: "1px solid var(--c-border)", borderRadius: 14, background: "var(--c-surface)", padding: "1rem 1.25rem", marginBottom: "1.5rem" },
  builtinHead:   { marginBottom: "0.75rem" },
  builtinTitle:  { margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--c-text)" },
  builtinSub:    { margin: "0.2rem 0 0", fontSize: "0.8125rem", color: "var(--c-muted)" },
  builtinRow:    { display: "flex", flexWrap: "wrap" as const, gap: "0.75rem" },
  builtinCard:   { display: "flex", alignItems: "center", gap: "0.625rem", border: "1px solid var(--c-border)", borderRadius: 10, background: "var(--c-surface-2)", padding: "0.5rem 0.875rem 0.5rem 0.5rem" },
  builtinSwatch: { width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  builtinName:   { fontSize: "0.85rem", fontWeight: 700, color: "var(--c-text)", whiteSpace: "nowrap" as const },
  builtinId:     { fontSize: "0.7rem", color: "var(--c-muted)", fontFamily: "monospace" },

  /* header */
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" as const },
  heading:    { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" },
  sub:        { margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--c-muted)" },
  headRight:  { display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0, flexWrap: "wrap" as const },
  stats:      { display: "flex", gap: "0.875rem" },
  statItem:   { display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8125rem", color: "var(--c-muted)" },
  dot:        { width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0 },

  newBtn: {
    padding: "0.5rem 1.125rem", background: "var(--c-accent)", color: "var(--c-lime-text)",
    border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
    transition: "opacity 0.15s",
  },

  /* empty state */
  empty:      { padding: "4rem 2rem", textAlign: "center" as const, border: "2px dashed var(--c-border)", borderRadius: 16, background: "var(--c-surface)" },
  emptyIcon:  { fontSize: "3rem", marginBottom: "0.75rem" },
  emptyTitle: { fontSize: "1.125rem", fontWeight: 700, color: "var(--c-text)", marginBottom: "0.5rem" },
  emptySub:   { fontSize: "0.9rem", color: "var(--c-muted)", marginBottom: "1.5rem", maxWidth: 380, marginLeft: "auto", marginRight: "auto" },

  /* grid */
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem", alignItems: "start" },

  /* "new" card */
  newCard: {
    aspectRatio: "3 / 4",
    border: "2px dashed var(--c-border)", borderRadius: 14, background: "var(--c-surface)",
    display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
    gap: "0.625rem", cursor: "pointer", color: "var(--c-muted)", transition: "border-color 0.2s, color 0.2s",
    padding: 0,
  },
  newPlus:  { fontSize: "2.5rem", lineHeight: 1, fontWeight: 300 },
  newLabel: { fontSize: "0.875rem", fontWeight: 600 },

  /* template card */
  card: {
    border: "1px solid var(--c-border)", borderRadius: 14, overflow: "hidden",
    background: "var(--c-surface)", display: "flex", flexDirection: "column" as const,
    transition: "box-shadow 0.2s, transform 0.2s",
  },

  /* portrait thumbnail */
  thumb: {
    aspectRatio: "3 / 4", display: "block", overflow: "hidden",
    position: "relative" as const, textDecoration: "none", background: "var(--c-surface-2)",
  },
  thumbImg:     { width: "100%", height: "100%", objectFit: "cover" as const, display: "block" },
  swatch:       { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  statusDot:    { position: "absolute" as const, top: 10, right: 10, width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.7)", boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" },
  thumbOverlay: {
    position: "absolute" as const, inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: 0, transition: "opacity 0.18s",
    /* CSS hover not possible in inline styles — use :hover via a CSS class or just skip overlay */
  },
  thumbOverlayLabel: { color: "#fff", fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.04em" },

  /* card body */
  body:    { padding: "0.875rem 1rem 1rem", display: "flex", flexDirection: "column" as const, gap: "0.625rem" },
  nameRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" },
  name:    { fontSize: "0.9rem", fontWeight: 700, color: "var(--c-text)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1 },
  badge:   { fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 999, flexShrink: 0, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  badgeOn: { background: "#dcfce7", color: "#15803d" },
  badgeOff:{ background: "var(--c-surface-2)", color: "var(--c-muted)", border: "1px solid var(--c-border)" },

  /* packages */
  pkgLabel:  { fontSize: "0.625rem", fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.35rem" },
  pkgRow:    { display: "flex", flexWrap: "wrap" as const, gap: "0.3rem" },
  chip:      { padding: "0.2rem 0.55rem", borderRadius: 999, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-muted)", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" },
  chipOn:    { background: "var(--c-accent-soft)", borderColor: "var(--c-accent)", color: "var(--c-accent)" },
  chipCheck: { fontSize: "0.65rem" },

  /* actions */
  actions:  { display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.125rem" },
  editBtn:  { padding: "0.35rem 0.75rem", background: "var(--c-accent)", color: "var(--c-lime-text)", borderRadius: 7, textDecoration: "none", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 },
  ghostBtn: { padding: "0.35rem 0.625rem", background: "var(--c-surface)", color: "var(--c-text)", border: "1px solid var(--c-border)", borderRadius: 7, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, flex: 1 },
  delBtn:   { padding: "0.35rem 0.5rem", background: "transparent", color: "var(--c-muted)", border: "1px solid var(--c-border)", borderRadius: 7, cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, marginLeft: "auto", transition: "color 0.15s, border-color 0.15s" },

  /* delete confirm */
  delConfirmBox: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "0.625rem 0.75rem", display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  delWarning:    { margin: 0, fontSize: "0.8rem", color: "#991b1b", fontWeight: 600 },
  delYesBtn:     { padding: "0.35rem 0.75rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 },
  delNoBtn:      { padding: "0.35rem 0.75rem", background: "transparent", color: "var(--c-text)", border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem" },

  /* name modal */
  modalBackdrop: {
    position: "fixed" as const, inset: 0, zIndex: 60,
    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
  },
  modal: {
    background: "var(--c-surface)", color: "var(--c-text)",
    borderRadius: 16, width: "100%", maxWidth: 440,
    boxShadow: "0 24px 80px rgba(0,0,0,0.4)", border: "1px solid var(--c-border)",
    display: "flex", flexDirection: "column" as const, overflow: "hidden",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "1.375rem 1.5rem 0.75rem",
  },
  modalTitle:  { margin: 0, fontSize: "1.125rem", fontWeight: 700 },
  modalSub:    { margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--c-muted)" },
  modalClose:  { background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", fontSize: "1rem", padding: 4, lineHeight: 1, flexShrink: 0 },
  modalBody:   { padding: "0.75rem 1.5rem 1rem", display: "flex", flexDirection: "column" as const, gap: "0.375rem" },
  modalLabel:  { fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-text)" },
  modalInput:  {
    padding: "0.625rem 0.875rem", border: "1px solid var(--c-border)",
    background: "var(--c-surface-2)", color: "var(--c-text)",
    borderRadius: 8, fontSize: "1rem", fontFamily: "inherit",
    outline: "none", width: "100%", boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  },
  modalErr:    { margin: 0, fontSize: "0.8125rem", color: "#dc2626" },
  modalFooter: {
    display: "flex", justifyContent: "flex-end", gap: "0.625rem", alignItems: "center",
    padding: "0.875rem 1.5rem", borderTop: "1px solid var(--c-border)",
    background: "var(--c-surface)",
  },
  modalCancelBtn: {
    padding: "0.5rem 1.125rem", background: "transparent", color: "var(--c-text)",
    border: "1px solid var(--c-border)", borderRadius: 8, cursor: "pointer",
    fontSize: "0.9rem", fontWeight: 500,
  },
  modalCreateBtn: {
    padding: "0.5rem 1.25rem", background: "var(--c-accent)", color: "var(--c-lime-text)",
    border: "none", borderRadius: 8, cursor: "pointer",
    fontSize: "0.9rem", fontWeight: 600, transition: "opacity 0.15s",
  },
} as const;
