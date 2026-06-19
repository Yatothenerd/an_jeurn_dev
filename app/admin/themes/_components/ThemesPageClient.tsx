"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeFormModal } from "./ThemeFormModal";
import { ThemeThumbnail, ThemePalette } from "@/app/dashboard/events/[id]/builder/_components/ThemeThumbnail";
import type { Theme } from "@/types";

interface Props {
  themes: Theme[];
}

export function ThemesPageClient({ themes }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Theme | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleActive(theme: Theme) {
    setToggling(theme.id);
    await fetch(`/api/admin/themes/${theme.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !theme.isActive }),
    });
    setToggling(null);
    router.refresh();
  }

  return (
    <div>
      <div style={s.pageHeader}>
        <h1 style={s.heading}>Themes</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a href="/admin/themes/assign" style={s.assignBtn}>Assign to Packages →</a>
          <button onClick={() => setShowCreate(true)} style={s.newBtn}>+ New Theme</button>
        </div>
      </div>

      {themes.length === 0 ? (
        <div style={s.empty}>No themes yet. Create one to get started.</div>
      ) : (
        <div style={s.grid}>
          {themes.map((t) => (
            <div key={t.id} style={{ ...s.card, opacity: t.isActive ? 1 : 0.5 }}>
              <div style={s.imgWrap}>
                {t.previewUrl ? (
                  <img src={t.previewUrl} alt={t.name} style={s.img} />
                ) : (
                  <ThemeThumbnail themeId={t.id} />
                )}
              </div>
              <div style={s.cardBody}>
                <div style={s.themeName}>{t.name}</div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <ThemePalette themeId={t.id} />
                </div>
                <div style={s.themeMeta}>
                  <span style={{ ...s.badge, ...(t.isActive ? s.badgeActive : s.badgeInactive) }}>
                    <span style={{ ...s.dot, background: t.isActive ? "#16a34a" : "#9ca3af" }} />
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                  {t.isAnimated && (
                    <span style={{ ...s.badge, ...s.badgeAnimated }}>✦ Animated</span>
                  )}
                  <span style={s.order}>#{t.sortOrder}</span>
                </div>
                <div style={s.actions}>
                  <button onClick={() => setEditing(t)} style={s.editBtn}>Edit</button>
                  <button
                    onClick={() => toggleActive(t)}
                    disabled={toggling === t.id}
                    style={s.toggleBtn}
                  >
                    {t.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <ThemeFormModal onClose={() => setShowCreate(false)} />}
      {editing && <ThemeFormModal theme={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const s = {
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  heading: { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111" },
  newBtn: {
    padding: "0.5rem 1rem",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
  assignBtn: {
    padding: "0.5rem 1rem",
    background: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "0.875rem",
    textDecoration: "none",
    fontWeight: 500,
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
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1rem",
  },
  card: {
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    transition: "opacity 0.2s",
  },
  imgWrap: { height: "140px", overflow: "hidden", background: "#f3f4f6" },
  img: { width: "100%", height: "100%", objectFit: "cover" as const },
  imgPlaceholder: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: "0.8125rem",
  },
  cardBody: { padding: "0.875rem" },
  themeName: { fontWeight: 600, fontSize: "0.9375rem", color: "#111", marginBottom: "0.5rem" },
  themeMeta: { display: "flex", gap: "0.375rem", flexWrap: "wrap" as const, marginBottom: "0.75rem", alignItems: "center" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
    padding: "0.2rem 0.5rem",
    borderRadius: "999px",
    border: "1px solid transparent",
    lineHeight: 1,
  },
  dot: { width: 6, height: 6, borderRadius: "50%", display: "block", flexShrink: 0 },
  badgeActive: { background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" },
  badgeInactive: { background: "#f9fafb", color: "#6b7280", borderColor: "#e5e7eb" },
  badgeAnimated: { background: "#f5f3ff", color: "#7c3aed", borderColor: "#ddd6fe" },
  order: { fontSize: "0.75rem", color: "#9ca3af", marginLeft: "auto", fontWeight: 600 },
  actions: { display: "flex", gap: "0.5rem" },
  editBtn: {
    flex: 1,
    padding: "0.375rem",
    border: "1px solid #e5e7eb",
    borderRadius: "5px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 500,
  },
  toggleBtn: {
    flex: 1,
    padding: "0.375rem",
    border: "none",
    borderRadius: "5px",
    background: "#f3f4f6",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "#374151",
  },
} as const;
