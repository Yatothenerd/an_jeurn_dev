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
  },
  heading: { margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "#111" },
  sub: { margin: 0, color: "#6b7280", fontSize: "0.875rem" },
  backBtn: {
    color: "#6b7280",
    textDecoration: "none",
    fontSize: "0.875rem",
    padding: "0.5rem 1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    whiteSpace: "nowrap" as const,
  },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" as const },
  tab: {
    padding: "0.5rem 1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  tabActive: { background: "#111", color: "#fff", border: "1px solid #111" },
  tabCount: {
    fontSize: "0.75rem",
    padding: "0.1rem 0.4rem",
    borderRadius: "4px",
    background: "rgba(255,255,255,0.15)",
  },
  empty: {
    padding: "3rem",
    textAlign: "center" as const,
    color: "#6b7280",
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "0.75rem",
    marginBottom: "5rem",
  },
  themeCard: {
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "border-color 0.15s",
    background: "#fff",
    display: "block",
  },
  themeCardChecked: { borderColor: "#2563eb" },
  imgWrap: { height: "110px", background: "#f3f4f6", position: "relative" as const, overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" as const },
  imgFallback: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: "0.75rem",
  },
  checkmark: {
    position: "absolute" as const,
    top: "6px",
    right: "6px",
    width: "22px",
    height: "22px",
    background: "#2563eb",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  themeLabel: { padding: "0.5rem 0.625rem", fontSize: "0.8125rem", fontWeight: 500, color: "#111" },
  saveBar: {
    position: "fixed" as const,
    bottom: 0,
    right: 0,
    left: "224px",
    background: "#fff",
    borderTop: "1px solid #e5e7eb",
    padding: "0.875rem 2.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  saveInfo: { fontSize: "0.875rem", color: "#374151" },
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
