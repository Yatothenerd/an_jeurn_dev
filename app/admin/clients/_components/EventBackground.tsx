"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Admin-only single background for an event's invitation (used by single-background
// themes like Spotlight). Clients cannot change this — it lives on the admin page.
export function EventBackground({ invitationId, backgroundUrl }: { invitationId: string; backgroundUrl: string | null }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isVideo = !!backgroundUrl && /\.(mp4|webm|mov)$/i.test(backgroundUrl);

  async function patch(url: string | null) {
    const res = await fetch(`/api/admin/invitations/${invitationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backgroundUrl: url }),
    });
    return res.ok;
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "invitations/background");
    const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!up.ok) { setBusy(false); setErr("Upload failed"); return; }
    const { url } = await up.json();
    const ok = await patch(url);
    setBusy(false);
    if (ref.current) ref.current.value = "";
    if (!ok) { setErr("Save failed"); return; }
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const ok = await patch(null);
    setBusy(false);
    if (ok) router.refresh();
  }

  return (
    <div style={s.wrap}>
      <div style={s.label}>Background <span style={{ opacity: 0.6 }}>(admin only)</span></div>
      <div style={s.row}>
        <div style={s.thumb}>
          {backgroundUrl ? (
            isVideo ? <video src={backgroundUrl} style={s.media} muted /> : <img src={backgroundUrl} alt="" style={s.media} />
          ) : (
            <span style={{ color: "var(--c-muted)", fontSize: "0.7rem" }}>None</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const }}>
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} style={s.btn}>
            {busy ? "…" : backgroundUrl ? "Replace" : "Upload"}
          </button>
          {backgroundUrl && <button type="button" onClick={remove} disabled={busy} style={s.remove}>Remove</button>}
        </div>
      </div>
      {err && <span style={{ color: "#dc2626", fontSize: "0.72rem" }}>{err}</span>}
      <input ref={ref} type="file" accept="image/*,video/mp4" onChange={upload} style={{ display: "none" }} />
    </div>
  );
}

const s = {
  wrap: { marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--c-border)", display: "flex", flexDirection: "column" as const, gap: "0.4rem" },
  label: { fontSize: "0.6875rem", fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  row: { display: "flex", alignItems: "center", gap: "0.6rem" },
  thumb: { width: 64, height: 44, borderRadius: 8, overflow: "hidden" as const, background: "var(--c-surface-2)", border: "1px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  media: { width: "100%", height: "100%", objectFit: "cover" as const },
  btn: { padding: "0.35rem 0.7rem", border: "1px solid var(--c-border)", background: "var(--c-surface)", color: "var(--c-text)", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 },
  remove: { padding: "0.35rem 0.6rem", border: "none", background: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.78rem" },
} as const;
