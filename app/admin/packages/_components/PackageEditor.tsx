"use client";

import { useState } from "react";

type PackageFlag =
  | "hasMusic" | "hasVideo" | "hasKhqr" | "hasWishing"
  | "hasHosting" | "hasCustomThumb" | "hasGuestControl" | "hasLogo";

type PackageLimit = "maxSections" | "maxPhotos" | "maxGuests";

type PackageData = Record<string, unknown> & {
  id: string;
  name: string;
  slug: string;
  priceUsd: number | string;
};

interface Props {
  pkg: PackageData;
}

const FEATURE_FLAGS: Array<{ key: PackageFlag; label: string }> = [
  { key: "hasMusic", label: "Background music" },
  { key: "hasVideo", label: "Video support" },
  { key: "hasKhqr", label: "KHQR payment" },
  { key: "hasWishing", label: "Wishing wall" },
  { key: "hasHosting", label: "Hosted invitation" },
  { key: "hasCustomThumb", label: "Custom thumbnail" },
  { key: "hasGuestControl", label: "Guest control" },
  { key: "hasLogo", label: "Custom logo" },
];

const LIMITS: Array<{ key: PackageLimit; label: string }> = [
  { key: "maxSections", label: "Max sections" },
  { key: "maxPhotos", label: "Max photos" },
  { key: "maxGuests", label: "Max guests" },
];

export function PackageEditor({ pkg }: Props) {
  const [form, setForm] = useState<Record<string, unknown>>({ ...pkg });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function setFlag(key: string, value: boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }
  function setLimit(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: Number(value) }));
    setSaved(false);
  }

  function startEdit() {
    setSaved(false);
    setError("");
    setEditing(true);
  }
  function cancel() {
    setForm({ ...pkg }); // revert any unsaved changes
    setError("");
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    const body: Record<string, unknown> = {};
    for (const { key } of FEATURE_FLAGS) body[key] = form[key];
    for (const { key } of LIMITS) body[key] = form[key];

    const res = await fetch(`/api/admin/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setEditing(false);
    } else {
      setError("Failed to save");
    }
  }

  return (
    <div className="admin-card" style={s.card}>
      <div style={s.cardHeader}>
        <div>
          <h2 style={s.pkgName}>{pkg.name}</h2>
          <p style={s.pkgSlug}>{pkg.slug}</p>
        </div>
        <div style={s.headerRight}>
          <div style={s.price}>${Number(pkg.priceUsd).toFixed(0)}</div>
          {!editing && (
            <>
              {saved && <span style={s.savedMsg}>Saved ✓</span>}
              <button onClick={startEdit} style={s.editBtn}>Edit</button>
            </>
          )}
        </div>
      </div>

      {!editing ? (
        // ── Read-only view ──
        <>
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Limits</h3>
            <div style={s.readGrid}>
              {LIMITS.map(({ key, label }) => (
                <div key={key} style={s.readItem}>
                  <span style={s.readLabel}>{label}</span>
                  <span style={s.readValue}>{String(form[key] ?? "—")}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...s.section, borderBottom: "none" }}>
            <h3 style={s.sectionTitle}>Features</h3>
            <div style={s.flagsGrid}>
              {FEATURE_FLAGS.map(({ key, label }) => {
                const on = !!form[key];
                return (
                  <span key={key} style={{ ...s.featChip, ...(on ? s.featOn : s.featOff) }}>
                    <span aria-hidden>{on ? "✓" : "✕"}</span> {label}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        // ── Edit mode ──
        <>
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Limits</h3>
            <div style={s.limitsGrid}>
              {LIMITS.map(({ key, label }) => (
                <div key={key} style={s.limitField}>
                  <label style={s.limitLabel}>{label}</label>
                  <input
                    type="number"
                    min={0}
                    value={form[key] as number}
                    onChange={(e) => setLimit(key, e.target.value)}
                    style={s.limitInput}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={s.section}>
            <h3 style={s.sectionTitle}>Features</h3>
            <div style={s.flagsGrid}>
              {FEATURE_FLAGS.map(({ key, label }) => (
                <label key={key} style={s.flag}>
                  <input type="checkbox" checked={!!form[key]} onChange={(e) => setFlag(key, e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={s.footer}>
            {error && <span style={s.error}>{error}</span>}
            <button onClick={cancel} style={s.cancelBtn}>Cancel</button>
            <button onClick={save} disabled={saving} style={s.saveBtn}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  card: { overflow: "hidden", padding: 0 },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid var(--c-border)",
    background: "var(--c-surface-2)",
    flexWrap: "wrap" as const,
    gap: "0.75rem",
  },
  headerRight: { display: "flex", alignItems: "center", gap: "0.9rem" },
  pkgName: { margin: "0 0 0.125rem", fontSize: "1.05rem", fontWeight: 700, color: "var(--c-text)" },
  pkgSlug: { margin: 0, fontSize: "0.75rem", color: "var(--c-muted)" },
  price: { fontSize: "1.5rem", fontWeight: 800, color: "var(--c-text)" },
  editBtn: {
    padding: "0.45rem 1.1rem", background: "var(--c-accent)", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
  },
  savedMsg: { fontSize: "0.8125rem", color: "#16a34a", fontWeight: 600 },
  section: { padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--c-border)" },
  sectionTitle: {
    margin: "0 0 0.875rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-muted)",
    textTransform: "uppercase" as const, letterSpacing: "0.05em",
  },
  // read-only
  readGrid: { display: "flex", gap: "2rem", flexWrap: "wrap" as const },
  readItem: { display: "flex", flexDirection: "column" as const, gap: "0.2rem" },
  readLabel: { fontSize: "0.75rem", color: "var(--c-muted)" },
  readValue: { fontSize: "1.25rem", fontWeight: 700, color: "var(--c-text)" },
  featChip: {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    padding: "0.3rem 0.7rem", borderRadius: "999px", fontSize: "0.8125rem", fontWeight: 600,
  },
  featOn: { background: "var(--c-accent-soft)", color: "var(--c-accent)" },
  featOff: { background: "var(--c-surface-2)", color: "var(--c-muted)" },
  // edit
  limitsGrid: { display: "flex", gap: "1rem", flexWrap: "wrap" as const },
  limitField: { display: "flex", flexDirection: "column" as const, gap: "0.375rem" },
  limitLabel: { fontSize: "0.8125rem", fontWeight: 500, color: "var(--c-muted)" },
  limitInput: {
    padding: "0.4rem 0.625rem", border: "1px solid var(--c-border)", background: "transparent",
    color: "var(--c-text)", borderRadius: "6px", fontSize: "0.9375rem", width: "100px",
  },
  flagsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.625rem" },
  flag: { display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "var(--c-text)" },
  footer: { padding: "1rem 1.5rem", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.75rem" },
  error: { fontSize: "0.875rem", color: "#dc2626", marginRight: "auto" },
  cancelBtn: {
    padding: "0.5rem 1rem", background: "transparent", border: "1px solid var(--c-border)",
    color: "var(--c-text)", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
  },
  saveBtn: {
    padding: "0.5rem 1.25rem", background: "var(--c-accent)", color: "#fff", border: "none",
    borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
  },
} as const;
