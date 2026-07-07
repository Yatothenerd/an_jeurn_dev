"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ThemeSummary } from "@/lib/themes/registry";

interface TemplateCard {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  packages: Array<{ id: string; name: string }>;
}

interface Props {
  eventId: string;
  slug: string;
  currentThemeId: string;
  overlayConfig: Record<string, unknown> | null;
  clientPackage: { id: string; name: string } | null;
  themes: ThemeSummary[];
  templates: TemplateCard[];
}

/**
 * Step 2 — Design. Two clearly separated choices:
 *  • Templates — finished designs from the Theme Studio (package-gated).
 *    Applying one SNAPSHOTS its whole design (theme, colors, placeholder
 *    content) onto this event.
 *  • Base themes — start bare on a theme and fill everything in Content.
 * The live preview on the right always shows the real invitation.
 */
export function DesignPicker({ eventId, slug, currentThemeId, overlayConfig, clientPackage, themes, templates }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [previewV, setPreviewV] = useState(0);
  const [confirmTpl, setConfirmTpl] = useState<TemplateCard | null>(null);

  async function applyTemplate(tpl: TemplateCard) {
    setBusy(tpl.id);
    setNote("");
    const res = await fetch(`/api/admin/events/${eventId}/apply-template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: tpl.id }),
    }).catch(() => null);
    setBusy(null);
    setConfirmTpl(null);
    if (res?.ok) {
      setNote(`Applied “${tpl.name}” — its design replaced this event's previous design.`);
      setPreviewV((v) => v + 1);
      router.refresh();
    } else {
      setNote("Failed to apply the template. Please try again.");
    }
  }

  async function pickTheme(themeId: string) {
    setBusy(themeId);
    setNote("");
    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overlayConfig: { ...(overlayConfig ?? {}), themeId } }),
    }).catch(() => null);
    setBusy(null);
    if (res?.ok) {
      setPreviewV((v) => v + 1);
      router.refresh();
    } else {
      setNote("Failed to switch the theme. Please try again.");
    }
  }

  const allowed = (tpl: TemplateCard) =>
    !!clientPackage && tpl.packages.some((p) => p.id === clientPackage.id);

  return (
    <div style={s.wrap}>
      <div style={s.panel}>
        {note && <div style={s.note}>{note}</div>}

        {/* ── Templates ── */}
        <div style={s.card}>
          <h2 style={s.h2}>Templates</h2>
          <p style={s.sub}>
            Finished designs from the <Link href="/admin/themes" style={s.link}>Theme Studio</Link>.
            {clientPackage
              ? <> Showing availability for the client&rsquo;s <strong>{clientPackage.name}</strong> package.</>
              : <> This client has no active package — grant one to unlock templates.</>}
          </p>
          {templates.length === 0 ? (
            <p style={s.empty}>No templates yet — create one in the Theme Studio.</p>
          ) : (
            <div style={s.tplGrid}>
              {templates.map((t) => {
                const ok = allowed(t);
                return (
                  <div key={t.id} style={{ ...s.tplCard, opacity: ok ? 1 : 0.55 }}>
                    <div style={s.tplThumb}>
                      {t.thumbnailUrl
                        ? <img src={t.thumbnailUrl} alt="" style={s.tplImg} />
                        : <span style={{ fontSize: "1.5rem" }}>🎨</span>}
                    </div>
                    <div style={s.tplBody}>
                      <div style={s.tplName}>{t.name}</div>
                      <div style={s.tplPkgs}>
                        {t.packages.length > 0 ? t.packages.map((p) => p.name).join(" · ") : "No packages assigned"}
                      </div>
                      {ok ? (
                        <button style={s.applyBtn} disabled={busy !== null} onClick={() => setConfirmTpl(t)}>
                          {busy === t.id ? "Applying…" : "Apply"}
                        </button>
                      ) : (
                        <span style={s.lock}>🔒 Not in client&rsquo;s package</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Base themes ── */}
        <div style={s.card}>
          <h2 style={s.h2}>Base themes</h2>
          <p style={s.sub}>Start bare on a theme and fill in everything yourself in the Content step.</p>
          <div style={s.themeGrid}>
            {themes.map((t) => {
              const active = t.id === currentThemeId;
              return (
                <button key={t.id} style={{ ...s.themeCard, ...(active ? s.themeCardOn : {}) }}
                  disabled={busy !== null}
                  onClick={() => pickTheme(t.id)}>
                  <span style={{ ...s.swatch, background: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.accent})` }} />
                  <span style={{ textAlign: "left" }}>
                    <span style={s.themeName}>{t.name}</span>
                    <span style={s.themeKind}>
                      {t.kind === "builder"
                        ? "Freeform builder — fully editable"
                        : t.kind === "standard"
                        ? "Standard — fully customizable"
                        : t.locked
                        ? "🔒 Preset — design locked, content editable"
                        : "Coded design"}
                    </span>
                  </span>
                  {active && <span style={s.check}>✓ Current</span>}
                </button>
              );
            })}
          </div>
          {currentThemeId === "theme-freeform" && (
            <Link href={`/admin/events/${eventId}/builder`} style={s.builderBtn}>
              Open the Freeform builder →
            </Link>
          )}
        </div>

        <div style={s.next}>
          <Link href={`/admin/events/${eventId}/content`} style={s.nextBtn}>Next: Content →</Link>
        </div>
      </div>

      {/* ── Live preview (the real invitation) ── */}
      <div style={s.previewCol}>
        <div style={s.previewBar}>
          <span style={{ fontSize: "0.8rem", color: "var(--c-muted)" }}>Live preview</span>
          <button style={s.reloadBtn} onClick={() => setPreviewV((v) => v + 1)}>↻ Reload</button>
        </div>
        <div style={s.phone}>
          <iframe key={previewV} src={`/invite/${slug}?preview=1&v=${previewV}`} style={s.phoneScreen} title="Live invitation preview" />
        </div>
      </div>

      {/* ── Apply confirmation (replacing a design is destructive) ── */}
      {confirmTpl && (
        <div style={s.modalBg} onClick={(e) => { if (e.target === e.currentTarget) setConfirmTpl(null); }}>
          <div style={s.modal}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--c-text)" }}>Apply “{confirmTpl.name}”?</h3>
            <p style={{ ...s.sub, margin: "0.5rem 0 1rem" }}>
              This replaces the event&rsquo;s current design (theme, colors, section layout) with the template&rsquo;s.
              Guests, photos and wishes are kept.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button style={s.cancelBtn} onClick={() => setConfirmTpl(null)}>Cancel</button>
              <button style={s.applyBtn} disabled={busy !== null} onClick={() => void applyTemplate(confirmTpl)}>
                {busy ? "Applying…" : "Apply template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { display: "flex", gap: "1.25rem", alignItems: "flex-start" },
  panel: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, gap: "1rem" },
  note: { padding: "0.6rem 0.9rem", borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "0.85rem" },
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "1.1rem", display: "flex", flexDirection: "column" as const, gap: "0.7rem" },
  h2: { margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--c-text)" },
  sub: { margin: 0, fontSize: "0.82rem", color: "var(--c-muted)", lineHeight: 1.45 },
  link: { color: "var(--c-accent)" },
  empty: { margin: 0, fontSize: "0.85rem", color: "var(--c-muted)", fontStyle: "italic" },

  tplGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" },
  tplCard: { border: "1px solid var(--c-border)", borderRadius: 10, overflow: "hidden", background: "var(--c-surface-2)" },
  tplThumb: { height: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-surface)", overflow: "hidden" },
  tplImg: { width: "100%", height: "100%", objectFit: "cover" as const },
  tplBody: { padding: "0.6rem 0.7rem", display: "flex", flexDirection: "column" as const, gap: "0.3rem" },
  tplName: { fontSize: "0.85rem", fontWeight: 700, color: "var(--c-text)" },
  tplPkgs: { fontSize: "0.7rem", color: "var(--c-muted)" },
  applyBtn: { padding: "0.4rem 0.9rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, alignSelf: "flex-start" as const },
  lock: { fontSize: "0.72rem", color: "var(--c-muted)" },

  themeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.6rem" },
  themeCard: { display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.7rem", borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", cursor: "pointer", textAlign: "left" as const, position: "relative" as const },
  themeCardOn: { border: "1px solid var(--c-accent)", boxShadow: "0 0 0 1px var(--c-accent)" },
  swatch: { width: 26, height: 26, borderRadius: "50%", flexShrink: 0, border: "1px solid rgba(0,0,0,0.15)" },
  themeName: { display: "block", fontSize: "0.84rem", fontWeight: 700, color: "var(--c-text)" },
  themeKind: { display: "block", fontSize: "0.7rem", color: "var(--c-muted)" },
  check: { marginLeft: "auto", fontSize: "0.72rem", fontWeight: 700, color: "var(--c-accent)", flexShrink: 0 },
  builderBtn: { alignSelf: "flex-start" as const, padding: "0.45rem 1rem", background: "var(--c-surface-2)", border: "1px solid var(--c-accent)", color: "var(--c-accent)", borderRadius: 8, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 },

  next: { display: "flex", justifyContent: "flex-end" },
  nextBtn: { padding: "0.55rem 1.25rem", background: "var(--c-accent)", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 },

  previewCol: { width: 420, flexShrink: 0, position: "sticky" as const, top: "1rem" },
  previewBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" },
  reloadBtn: { padding: "0.3rem 0.7rem", borderRadius: 7, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" },
  phone: { width: 395, height: 720, margin: "0 auto", borderRadius: 34, border: "10px solid #16181d", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden", background: "#000" },
  phoneScreen: { width: 375, height: 700, border: "none", display: "block" },

  modalBg: { position: "fixed" as const, inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  modal: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 14, padding: "1.25rem", width: "100%", maxWidth: 420 },
  cancelBtn: { padding: "0.4rem 0.9rem", background: "transparent", color: "var(--c-text)", border: "1px solid var(--c-border)", borderRadius: 7, cursor: "pointer", fontSize: "0.8rem" },
} as const;
