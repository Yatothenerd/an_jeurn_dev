"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BuilderTheme } from "./BuilderClient";
import { ThemeThumbnail, ThemePalette } from "./ThemeThumbnail";

interface Props {
  invitationId: string;
  currentThemeId: string;
  allowedThemes: BuilderTheme[];
  exclusiveThemeIds: string[];
}

export function ThemeTab({ invitationId, currentThemeId, allowedThemes, exclusiveThemeIds }: Props) {
  const exclusive = new Set(exclusiveThemeIds);
  const router = useRouter();
  const [selected, setSelected] = useState(currentThemeId);
  const [saving, setSaving] = useState(false);

  async function selectTheme(themeId: string) {
    if (themeId === selected) return;
    setSelected(themeId);
    setSaving(true);
    await fetch(`/api/dashboard/invitation/${invitationId}/theme`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId }),
    });
    setSaving(false);
    router.refresh();
  }

  if (allowedThemes.length === 0) {
    return (
      <div style={s.empty}>
        No themes available for your package. Contact your administrator.
      </div>
    );
  }

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.heading}>Choose a Theme</h2>
        {saving && <span style={s.saving}>Saving…</span>}
      </div>
      <div style={s.grid}>
        {allowedThemes.map((theme) => {
          const active = theme.id === selected;
          return (
            <button key={theme.id} onClick={() => selectTheme(theme.id)} style={s.card}>
              <div style={{ ...s.imgWrap, ...(active ? s.imgWrapActive : {}) }}>
                {theme.previewUrl ? (
                  <img src={theme.previewUrl} alt={theme.name} style={s.img} />
                ) : (
                  <ThemeThumbnail themeId={theme.id} />
                )}
                {active && <div style={s.checkmark}>✓</div>}
                {exclusive.has(theme.id) && <span style={s.exclBadge}>★ Exclusive</span>}
                {theme.isAnimated && <span style={s.animBadge}>Animated</span>}
              </div>
              <div style={s.themeName}>{theme.name}</div>
              <div style={{ marginTop: "0.375rem" }}>
                <ThemePalette themeId={theme.id} size={14} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  empty: {
    padding: "3rem",
    textAlign: "center" as const,
    color: "#64748b",
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  header: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" },
  heading: { margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a" },
  saving: { fontSize: "0.8125rem", color: "#7c3aed" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.875rem" },
  card: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textAlign: "left" as const,
  },
  imgWrap: {
    borderRadius: "8px",
    overflow: "hidden",
    border: "2px solid #e2e8f0",
    height: "130px",
    background: "#f1f5f9",
    position: "relative" as const,
    transition: "border-color 0.15s",
  },
  imgWrapActive: { borderColor: "#7c3aed" },
  img: { width: "100%", height: "100%", objectFit: "cover" as const },
  imgFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    color: "#94a3b8",
  },
  checkmark: {
    position: "absolute" as const,
    top: "6px",
    right: "6px",
    width: "24px",
    height: "24px",
    background: "#7c3aed",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  animBadge: {
    position: "absolute" as const,
    bottom: "6px",
    left: "6px",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: "0.625rem",
    fontWeight: 600,
    padding: "0.125rem 0.375rem",
    borderRadius: "3px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  exclBadge: {
    position: "absolute" as const,
    top: "6px",
    left: "6px",
    background: "linear-gradient(90deg,#7c3aed,#a855f7)",
    color: "#fff",
    fontSize: "0.625rem",
    fontWeight: 700,
    padding: "0.15rem 0.4rem",
    borderRadius: "999px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    boxShadow: "0 1px 4px rgba(124,58,237,0.4)",
  },
  themeName: { marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "#0f172a" },
} as const;
