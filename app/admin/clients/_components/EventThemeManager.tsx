"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ThemeRef {
  id: string;
  name: string;
}

interface Props {
  eventId: string;
  /**
   * The single exclusive theme currently assigned to this event (if any).
   * Backend now enforces at most one exclusive theme per event.
   */
  assigned: ThemeRef[];
  /** Full active theme catalog to pick from. */
  allThemes: ThemeRef[];
  /** The theme currently active on the invitation (Invitation.themeId). */
  activeThemeName?: string | null;
}

export function EventThemeManager({ eventId, assigned, allThemes, activeThemeName }: Props) {
  const router = useRouter();
  // Backend enforces exactly one exclusive theme per event; use first element.
  const current = assigned[0] ?? null;
  const [themeId, setThemeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);

  async function assign() {
    if (!themeId || loading) return;
    setLoading(true);
    const res = await fetch("/api/admin/themes/assign-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, themeId }),
    });
    setLoading(false);
    if (res.ok) { setChanging(false); setThemeId(""); router.refresh(); }
    else alert("Failed to assign theme");
  }

  async function release() {
    if (!current || loading) return;
    setLoading(true);
    const res = await fetch("/api/admin/themes/assign-event", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, themeId: current.id }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("Failed to release theme");
  }

  // Themes available for assignment (all active themes).
  const otherThemes = allThemes.filter((t) => t.id !== current?.id);

  return (
    <div style={s.wrap}>
      <div style={s.label}>Assigned Theme</div>

      {/* Active invitation theme (what the live invite currently renders) */}
      {activeThemeName && (
        <div style={s.activeRow}>
          <span style={s.activeDot} />
          <span style={s.activeName}>{activeThemeName}</span>
          <span style={s.activeTag}>active</span>
        </div>
      )}

      {/* Exclusive grant (what the client can see/switch to in their builder) */}
      {current ? (
        <div style={s.currentRow}>
          <span style={s.chip}>
            {current.name}
            <button
              onClick={release}
              disabled={loading}
              style={s.releaseBtn}
              title="Remove exclusive grant"
            >
              ×
            </button>
          </span>
          {!changing && otherThemes.length > 0 && (
            <button onClick={() => { setChanging(true); setThemeId(""); }} style={s.changeBtn} disabled={loading}>
              Change
            </button>
          )}
        </div>
      ) : (
        <span style={s.none}>No exclusive theme</span>
      )}

      {/* Assign / Change picker */}
      {(!current || changing) && otherThemes.length > 0 && (
        <div style={s.row}>
          <select value={themeId} onChange={(e) => setThemeId(e.target.value)} style={s.select}>
            <option value="" disabled>{current ? "Change to…" : "Pick a theme…"}</option>
            {otherThemes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button onClick={assign} disabled={loading || !themeId} style={s.assignBtn}>
            {loading ? "…" : current ? "Replace" : "Assign"}
          </button>
          {changing && (
            <button onClick={() => { setChanging(false); setThemeId(""); }} style={s.cancelBtn} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--c-border)", display: "flex", flexDirection: "column" as const, gap: "0.4rem" },
  label: { fontSize: "0.6875rem", fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  activeRow: { display: "flex", alignItems: "center", gap: "0.35rem" },
  activeDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 },
  activeName: { fontSize: "0.8125rem", color: "var(--c-text)", fontWeight: 500 },
  activeTag: { fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "#15803d", background: "#dcfce7", padding: "0.1rem 0.4rem", borderRadius: "4px" },
  currentRow: { display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" as const },
  none: { fontSize: "0.8125rem", color: "var(--c-muted)" },
  chip: { display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "var(--c-accent-soft)", border: "1px solid transparent", color: "var(--c-accent)", borderRadius: "999px", padding: "0.15rem 0.3rem 0.15rem 0.6rem", fontSize: "0.75rem", fontWeight: 600 },
  releaseBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--c-accent)", fontSize: "0.95rem", lineHeight: 1, padding: "0 0.1rem", opacity: 0.8 },
  changeBtn: { fontSize: "0.75rem", fontWeight: 600, color: "var(--c-accent)", background: "none", border: "1px solid var(--c-accent)", borderRadius: "6px", padding: "0.15rem 0.5rem", cursor: "pointer" },
  row: { display: "flex", gap: "0.4rem", flexWrap: "wrap" as const, alignItems: "center" },
  select: { padding: "0.35rem 0.5rem", border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-text)", borderRadius: "6px", fontSize: "0.8125rem", fontFamily: "inherit" },
  assignBtn: { padding: "0.35rem 0.7rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 },
  cancelBtn: { padding: "0.35rem 0.6rem", background: "none", border: "1px solid var(--c-border)", color: "var(--c-muted)", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem" },
} as const;
