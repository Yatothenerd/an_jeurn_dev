"use client";

import { useState } from "react";

type PackageFlag =
  | "hasMusic" | "hasVideo" | "hasKhqr" | "hasWishing"
  | "hasHosting" | "hasCustomThumb" | "hasGuestControl" | "hasLogo";

type PackageLimit = "maxSections" | "maxPhotos" | "maxGuests";

// Accepts a plain object since the Prisma Package type may not be resolvable until generation
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

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);

    const body: Record<string, unknown> = {};
    for (const { key } of FEATURE_FLAGS) body[key] = form[key];
    for (const { key } of LIMITS) body[key] = form[key];

    const res = await fetch(`/api/admin/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) setSaved(true);
    else setError("Failed to save");
  }

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div>
          <h2 style={s.pkgName}>{pkg.name}</h2>
          <p style={s.pkgSlug}>{pkg.slug}</p>
        </div>
        <div style={s.price}>${Number(pkg.priceUsd).toFixed(0)}</div>
      </div>

      {/* Limits */}
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

      {/* Feature Flags */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Features</h3>
        <div style={s.flagsGrid}>
          {FEATURE_FLAGS.map(({ key, label }) => (
            <label key={key} style={s.flag}>
              <input
                type="checkbox"
                checked={!!form[key]}
                onChange={(e) => setFlag(key, e.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={s.footer}>
        {error && <span style={s.error}>{error}</span>}
        {saved && <span style={s.savedMsg}>Saved ✓</span>}
        <button onClick={save} disabled={saving} style={s.saveBtn}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

const s = {
  card: {
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  pkgName: { margin: "0 0 0.125rem", fontSize: "1rem", fontWeight: 700, color: "#111" },
  pkgSlug: { margin: 0, fontSize: "0.75rem", color: "#9ca3af" },
  price: { fontSize: "1.5rem", fontWeight: 700, color: "#374151" },
  section: { padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6" },
  sectionTitle: {
    margin: "0 0 0.875rem",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  limitsGrid: { display: "flex", gap: "1rem", flexWrap: "wrap" as const },
  limitField: { display: "flex", flexDirection: "column" as const, gap: "0.375rem" },
  limitLabel: { fontSize: "0.8125rem", fontWeight: 500, color: "#374151" },
  limitInput: {
    padding: "0.4rem 0.625rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.9375rem",
    width: "100px",
  },
  flagsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "0.625rem",
  },
  flag: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#374151",
  },
  footer: {
    padding: "1rem 1.5rem",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "0.75rem",
  },
  error: { fontSize: "0.875rem", color: "#dc2626" },
  savedMsg: { fontSize: "0.875rem", color: "#16a34a", fontWeight: 500 },
  saveBtn: {
    padding: "0.5rem 1.25rem",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
} as const;
