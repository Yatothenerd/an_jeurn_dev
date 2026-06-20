"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ThemeRef {
  id: string;
  name: string;
}

interface Props {
  eventId: string;
  /** Themes currently assigned exclusively to this event. */
  assigned: ThemeRef[];
  /** Full active theme catalog to assign from. */
  allThemes: ThemeRef[];
}

// Admin control to grant a bespoke theme to one specific event and release it
// once the event is over. Released themes can then be recycled into a package
// via the Themes → Assign screen.
export function EventThemeManager({ eventId, assigned, allThemes }: Props) {
  const router = useRouter();
  const [themeId, setThemeId] = useState("");
  const [loading, setLoading] = useState(false);

  const assignedIds = new Set(assigned.map((t) => t.id));
  const assignable = allThemes.filter((t) => !assignedIds.has(t.id));

  async function call(method: "POST" | "DELETE", body: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch("/api/admin/themes/assign-event", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("Action failed");
  }

  return (
    <div style={s.wrap}>
      <div style={s.label}>Exclusive themes</div>
      <div style={s.chips}>
        {assigned.length === 0 && <span style={s.none}>None</span>}
        {assigned.map((t) => (
          <span key={t.id} style={s.chip}>
            {t.name}
            <button
              onClick={() => call("DELETE", { eventId, themeId: t.id })}
              disabled={loading}
              style={s.release}
              title="Release from this event"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {assignable.length > 0 && (
        <div style={s.row}>
          <select value={themeId} onChange={(e) => setThemeId(e.target.value)} style={s.select}>
            <option value="" disabled>Assign a theme…</option>
            {assignable.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={() => themeId && call("POST", { eventId, themeId })}
            disabled={loading || !themeId}
            style={s.assignBtn}
          >
            Assign
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--c-border)", display: "flex", flexDirection: "column" as const, gap: "0.4rem" },
  label: { fontSize: "0.6875rem", fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  chips: { display: "flex", flexWrap: "wrap" as const, gap: "0.35rem", alignItems: "center" },
  none: { fontSize: "0.8125rem", color: "var(--c-muted)" },
  chip: { display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "var(--c-accent-soft)", border: "1px solid transparent", color: "var(--c-accent)", borderRadius: "999px", padding: "0.15rem 0.3rem 0.15rem 0.6rem", fontSize: "0.75rem", fontWeight: 600 },
  release: { background: "none", border: "none", cursor: "pointer", color: "var(--c-accent)", fontSize: "0.95rem", lineHeight: 1, padding: "0 0.1rem", opacity: 0.8 },
  row: { display: "flex", gap: "0.4rem", flexWrap: "wrap" as const },
  select: { padding: "0.35rem 0.5rem", border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-text)", borderRadius: "6px", fontSize: "0.8125rem", fontFamily: "inherit" },
  assignBtn: { padding: "0.35rem 0.7rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 },
} as const;
