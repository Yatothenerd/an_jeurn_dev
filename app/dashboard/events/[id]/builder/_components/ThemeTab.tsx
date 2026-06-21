"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BuilderTheme } from "./BuilderClient";

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
  const [error, setError] = useState("");

  const canSwitch = allowedThemes.length > 1;

  async function selectTheme(themeId: string) {
    if (themeId === selected || saving) return;
    setError("");
    setSelected(themeId);
    setSaving(true);
    const res = await fetch(`/api/dashboard/invitation/${invitationId}/theme`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to update theme");
      setSelected(currentThemeId);
      return;
    }
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
        <h2 style={s.heading}>{canSwitch ? "Choose a Theme" : "Your Theme"}</h2>
        {saving && <span style={s.saving}>Saving…</span>}
      </div>
      <div style={s.grid}>
        {allowedThemes.map((theme) => {
          const active = theme.id === selected;
          const imgUrl = theme.thumbnailUrl ?? theme.previewUrl ?? null;
          return (
            <button
              key={theme.id}
              onClick={() => canSwitch ? selectTheme(theme.id) : undefined}
              disabled={!canSwitch || saving}
              style={{ ...s.card, cursor: canSwitch ? "pointer" : "default" }}
            >
              <div style={{ ...s.imgWrap, ...(active ? s.imgWrapActive : {}) }}>
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl} alt={theme.name} style={s.img} />
                ) : (
                  <div style={s.imgFallback}>🎨</div>
                )}
                {active && <div style={s.checkmark}>✓</div>}
                {exclusive.has(theme.id) && <span style={s.exclBadge}>★ Assigned</span>}
                {theme.isAnimated && <span style={s.animBadge}>Animated</span>}
              </div>
              <div style={s.themeName}>{theme.name}</div>
            </button>
          );
        })}
      </div>
      {!canSwitch && (
        <p style={s.singleNote}>
          Your current package includes one theme. Contact your administrator to unlock more options.
        </p>
      )}
      {error && <p style={s.error}>{error}</p>}
    </div>
  );
}

const s = {
  empty: {
    padding: "3rem",
    textAlign: "center" as const,
    color: "var(--c-muted)",
    background: "var(--c-surface)",
    borderRadius: "10px",
    border: "1px solid var(--c-border)",
  },
  header: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" },
  heading: { margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--c-text)" },
  saving: { fontSize: "0.8125rem", color: "var(--c-accent)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.875rem" },
  card: {
    background: "none",
    border: "none",
    padding: 0,
    textAlign: "left" as const,
    fontFamily: "inherit",
  },
  imgWrap: {
    borderRadius: "8px",
    overflow: "hidden",
    border: "2px solid var(--c-border)",
    height: "130px",
    background: "var(--c-surface-2)",
    position: "relative" as const,
    transition: "border-color 0.15s",
  },
  imgWrapActive: { borderColor: "var(--c-accent)" },
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
    background: "var(--c-accent)",
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
  themeName: { marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--c-text)" },
  singleNote: { marginTop: "1rem", fontSize: "0.8125rem", color: "var(--c-muted)" },
  error: { marginTop: "0.75rem", fontSize: "0.875rem", color: "#dc2626" },
} as const;
