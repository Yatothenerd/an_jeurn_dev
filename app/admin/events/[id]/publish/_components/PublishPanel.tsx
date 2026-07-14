"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface ChecklistItem {
  label: string;
  ok: boolean;
  /** Required items gate the publish button; the rest are warnings. */
  required: boolean;
  detail: string;
}

/**
 * Step 5 — Publish. THE one place an invitation goes live (or back to draft).
 * Required checklist items gate the button; warnings inform but don't block.
 */
export function PublishPanel({
  eventId,
  slug,
  isPublished,
  hasInvitation,
  checklist,
  watermarkNote,
}: {
  eventId: string;
  slug: string;
  isPublished: boolean;
  hasInvitation: boolean;
  checklist: ChecklistItem[];
  watermarkNote: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const blockers = checklist.filter((c) => c.required && !c.ok);
  const canPublish = hasInvitation && blockers.length === 0;

  // Origin is browser-only — start with the path so SSR and hydration match.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const shareUrl = `${origin}/invite/${slug}`;

  async function setPublished(next: boolean) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: next }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) router.refresh();
    else setError("Failed to update publish state. Please try again.");
  }

  async function copy() {
    await navigator.clipboard.writeText(shareUrl).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={s.h2}>Pre-flight checklist</h2>
        <div style={s.list}>
          {checklist.map((c) => (
            <div key={c.label} style={s.row}>
              <span style={{ ...s.mark, ...(c.ok ? s.markOk : c.required ? s.markBlock : s.markWarn) }}>
                {c.ok ? "✓" : c.required ? "✕" : "!"}
              </span>
              <div>
                <div style={s.rowLabel}>
                  {c.label}
                  {!c.ok && !c.required && <span style={s.warnTag}> (warning)</span>}
                </div>
                <div style={s.rowDetail}>{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
        {watermarkNote && <p style={s.note}>ℹ {watermarkNote}</p>}
      </div>

      <div style={s.card}>
        <h2 style={s.h2}>{isPublished ? "This invitation is live" : "Go live"}</h2>
        {isPublished ? (
          <>
            <p style={s.p}>
              Guests can open it right now. Edits in any step keep autosaving and reach guests within
              seconds — no re-publish needed.
            </p>
            <div style={s.shareRow}>
              <code style={s.shareLink}>{shareUrl}</code>
              <button style={s.smallBtn} onClick={() => void copy()}>{copied ? "Copied ✓" : "Copy"}</button>
              <a style={s.smallBtn} href={`/invite/${slug}`} target="_blank" rel="noreferrer">Open ↗</a>
            </div>
            <button style={{ ...s.bigBtn, ...s.unpublishBtn }} disabled={busy} onClick={() => void setPublished(false)}>
              {busy ? "Working…" : "Unpublish (back to draft)"}
            </button>
          </>
        ) : (
          <>
            <p style={s.p}>
              {canPublish
                ? "Everything required is in place. Publishing makes the invitation visible at the link below."
                : `Resolve ${blockers.length} required item${blockers.length === 1 ? "" : "s"} above before publishing.`}
            </p>
            <div style={s.shareRow}>
              <code style={s.shareLink}>{shareUrl}</code>
              <button style={s.smallBtn} onClick={() => void copy()}>{copied ? "Copied ✓" : "Copy"}</button>
            </div>
            <button style={{ ...s.bigBtn, opacity: canPublish ? 1 : 0.5 }} disabled={!canPublish || busy}
              onClick={() => void setPublished(true)}>
              {busy ? "Publishing…" : "Publish invitation"}
            </button>
          </>
        )}
        {error && <p style={s.err}>{error}</p>}
      </div>
    </div>
  );
}

const s = {
  wrap: { display: "flex", gap: "1.25rem", alignItems: "flex-start", flexWrap: "wrap" as const, maxWidth: 980 },
  card: { flex: 1, minWidth: 360, background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column" as const, gap: "0.9rem" },
  h2: { margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--c-text)" },
  p: { margin: 0, fontSize: "0.875rem", color: "var(--c-muted)", lineHeight: 1.5 },
  list: { display: "flex", flexDirection: "column" as const, gap: "0.7rem" },
  row: { display: "flex", gap: "0.6rem", alignItems: "flex-start" },
  mark: { width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, marginTop: 1 },
  markOk: { background: "#dcfce7", color: "#15803d" },
  markBlock: { background: "#fee2e2", color: "#b91c1c" },
  markWarn: { background: "#fef3c7", color: "#92400e" },
  rowLabel: { fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)" },
  warnTag: { fontSize: "0.72rem", fontWeight: 500, color: "#92400e" },
  rowDetail: { fontSize: "0.78rem", color: "var(--c-muted)", lineHeight: 1.4 },
  note: { margin: 0, fontSize: "0.78rem", color: "var(--c-muted)", borderTop: "1px solid var(--c-border)", paddingTop: "0.7rem" },
  shareRow: { display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" as const },
  shareLink: { flex: 1, minWidth: 200, fontSize: "0.78rem", padding: "0.5rem 0.7rem", background: "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: 8, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  smallBtn: { padding: "0.45rem 0.8rem", borderRadius: 7, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textDecoration: "none" },
  bigBtn: { padding: "0.7rem 1.25rem", background: "var(--c-accent)", color: "var(--c-lime-text)", border: "none", borderRadius: 9, cursor: "pointer", fontSize: "0.95rem", fontWeight: 700 },
  unpublishBtn: { background: "transparent", border: "1px solid var(--c-border)", color: "var(--c-text)", fontWeight: 600 },
  err: { margin: 0, fontSize: "0.8rem", color: "#dc2626" },
} as const;
