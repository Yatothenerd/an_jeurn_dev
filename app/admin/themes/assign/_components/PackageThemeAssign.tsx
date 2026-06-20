"use client";

import { useState } from "react";
import { ThemeThumbnail } from "@/app/dashboard/events/[id]/builder/_components/ThemeThumbnail";
import type { Package, Theme } from "@/types";

interface Props {
  packages: Omit<Package, "packageThemes">[];
  themes: Theme[];
  assignmentMap: Record<string, string[]>;
}

export function PackageThemeAssign({ packages, themes, assignmentMap }: Props) {
  const [activePackageId, setActivePackageId] = useState(packages[0]?.id ?? "");
  const [selected, setSelected] = useState<Record<string, Set<string>>>(() => {
    const map: Record<string, Set<string>> = {};
    for (const [pkgId, themeIds] of Object.entries(assignmentMap)) {
      map[pkgId] = new Set(themeIds);
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(themeId: string) {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(prev[activePackageId] ?? []);
      if (set.has(themeId)) set.delete(themeId);
      else set.add(themeId);
      next[activePackageId] = set;
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const themeIds = Array.from(selected[activePackageId] ?? []);
    const res = await fetch("/api/admin/themes/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: activePackageId, themeIds }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
    else alert("Failed to save");
  }

  const currentSet = selected[activePackageId] ?? new Set<string>();

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.heading}>Assign Themes to Packages</h1>
          <p style={s.sub}>
            Checked themes are available to clients on that package. Changes take effect immediately.
          </p>
        </div>
        <a href="/admin/themes" style={s.backBtn}>← Back to Themes</a>
      </div>

      {/* Package Tabs */}
      <div style={s.tabs}>
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => { setActivePackageId(pkg.id); setSaved(false); }}
            style={{
              ...s.tab,
              ...(activePackageId === pkg.id ? s.tabActive : {}),
            }}
          >
            {pkg.name}
            <span style={s.tabCount}>
              {(selected[pkg.id]?.size ?? 0)} themes
            </span>
          </button>
        ))}
      </div>

      {/* Theme Grid */}
      {themes.length === 0 ? (
        <div style={s.empty}>No active themes. Create themes first.</div>
      ) : (
        <div style={s.grid}>
          {themes.map((t) => {
            const checked = currentSet.has(t.id);
            return (
              <label key={t.id} style={{ ...s.themeCard, ...(checked ? s.themeCardChecked : {}) }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(t.id)}
                  style={{ display: "none" }}
                />
                <div style={s.imgWrap}>
                  {t.thumbnailUrl ? (
                    <img src={t.thumbnailUrl} alt={t.name} style={s.img} />
                  ) : t.previewUrl ? (
                    <img src={t.previewUrl} alt={t.name} style={s.img} />
                  ) : (
                    <ThemeThumbnail themeId={t.id} />
                  )}
                  {checked && <div style={s.checkmark}>✓</div>}
                </div>
                <div style={s.themeLabel}>{t.name}</div>
              </label>
            );
          })}
        </div>
      )}

      {/* Save Bar */}
      <div style={s.saveBar}>
        <span style={s.saveInfo}>
          {currentSet.size} of {themes.length} themes selected for{" "}
          <strong>{packages.find((p) => p.id === activePackageId)?.name}</strong>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {saved && <span style={s.savedMsg}>Saved ✓</span>}
          <button onClick={save} disabled={saving} style={s.saveBtn}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
  },
  heading: { margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" },
  sub: { margin: 0, color: "var(--c-muted)", fontSize: "0.875rem" },
  backBtn: {
    color: "var(--c-muted)",
    textDecoration: "none",
    fontSize: "0.875rem",
    padding: "0.5rem 1rem",
    border: "1px solid var(--c-border)",
    borderRadius: "7px",
    whiteSpace: "nowrap" as const,
  },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" as const },
  tab: {
    padding: "0.5rem 1rem",
    border: "1px solid var(--c-border)",
    borderRadius: "7px",
    background: "var(--c-surface)",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--c-text)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  tabActive: { background: "var(--c-accent)", color: "#fff", border: "1px solid var(--c-accent)" },
  tabCount: {
    fontSize: "0.75rem",
    padding: "0.1rem 0.4rem",
    borderRadius: "4px",
    background: "rgba(255,255,255,0.18)",
  },
  empty: {
    padding: "3rem",
    textAlign: "center" as const,
    color: "var(--c-muted)",
    background: "var(--c-surface)",
    borderRadius: "10px",
    border: "1px solid var(--c-border)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  themeCard: {
    border: "2px solid var(--c-border)",
    borderRadius: "8px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "border-color 0.15s",
    background: "var(--c-surface)",
    display: "block",
  },
  themeCardChecked: { borderColor: "var(--c-accent)" },
  imgWrap: { height: "110px", background: "var(--c-surface-2)", position: "relative" as const, overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" as const },
  imgFallback: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--c-muted)",
    fontSize: "0.75rem",
  },
  checkmark: {
    position: "absolute" as const,
    top: "6px",
    right: "6px",
    width: "22px",
    height: "22px",
    background: "var(--c-accent)",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  themeLabel: { padding: "0.5rem 0.625rem", fontSize: "0.8125rem", fontWeight: 500, color: "var(--c-text)" },
  saveBar: {
    position: "sticky" as const,
    bottom: "0.75rem",
    background: "var(--c-surface)",
    border: "1px solid var(--c-border)",
    borderRadius: "10px",
    padding: "0.875rem 1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap" as const,
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  },
  saveInfo: { fontSize: "0.875rem", color: "var(--c-muted)" },
  savedMsg: { fontSize: "0.875rem", color: "#16a34a", fontWeight: 500 },
  saveBtn: {
    padding: "0.5rem 1.25rem",
    background: "var(--c-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
} as const;
