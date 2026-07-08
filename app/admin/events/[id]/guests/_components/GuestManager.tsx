"use client";

import { useState } from "react";
import Link from "next/link";

interface Guest {
  id: string;
  name: string;
  contact: string | null;
  token: string | null;
  rsvpStatus: string | null;
}

/**
 * Guest management — a standalone task, deliberately NOT part of the invitation
 * build wizard (Details → Design → Content → Publish). Reached from the event
 * header "Guests" button. Add guests (each gets a personal invite link), copy
 * links, watch RSVPs come in. The global /admin/guests page remains for
 * cross-event search.
 */
export function GuestManager({ eventId, slug, initialGuests }: { eventId: string; slug: string; initialGuests: Guest[] }) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stats = {
    total: guests.length,
    yes: guests.filter((g) => g.rsvpStatus === "accepted" || g.rsvpStatus === "yes").length,
    no: guests.filter((g) => g.rsvpStatus === "declined" || g.rsvpStatus === "no").length,
  };
  const pending = stats.total - stats.yes - stats.no;

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/events/${eventId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), contact: contact.trim() || undefined }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) { setError("Failed to add guest."); return; }
    const { guest } = await res.json();
    setGuests((g) => [...g, guest].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    setContact("");
  }

  async function removeGuest(guestId: string) {
    setGuests((g) => g.filter((x) => x.id !== guestId));
    await fetch(`/api/admin/events/${eventId}/guests?guestId=${guestId}`, { method: "DELETE" }).catch(() => null);
  }

  async function copyLink(g: Guest) {
    const url = `${window.location.origin}/invite/${slug}${g.token ? `?g=${g.token}` : ""}`;
    await navigator.clipboard.writeText(url).catch(() => null);
    setCopiedId(g.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      <div style={s.pageHead}>
        <div>
          <h1 style={s.pageTitle}>Guests</h1>
          <p style={s.pageSub}>Invite people, share their personal links, and track RSVPs. Separate from the invitation editor.</p>
        </div>
        <Link href={`/admin/events/${eventId}/content`} style={s.backEditor}>← Back to editor</Link>
      </div>

      <div style={s.wrap}>
      <div style={s.main}>
        {/* Add guest */}
        <form onSubmit={addGuest} style={s.card}>
          <h2 style={s.h2}>Add guest</h2>
          <div style={s.addRow}>
            <input style={{ ...s.input, flex: 2 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" required />
            <input style={{ ...s.input, flex: 2 }} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone / email (optional)" />
            <button type="submit" style={s.addBtn} disabled={busy || !name.trim()}>{busy ? "Adding…" : "+ Add"}</button>
          </div>
          {error && <p style={s.err}>{error}</p>}
          <p style={s.hint}>Each guest gets a personal link — their name appears on the invitation cover when they open it.</p>
        </form>

        {/* Guest list */}
        <div style={s.card}>
          <h2 style={s.h2}>Guest list</h2>
          {guests.length === 0 ? (
            <p style={s.hint}>No guests yet. Add the first one above — or publish and let guests RSVP themselves.</p>
          ) : (
            <div style={s.list}>
              {guests.map((g) => (
                <div key={g.id} style={s.row}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={s.gName}>{g.name}</div>
                    {g.contact && <div style={s.gContact}>{g.contact}</div>}
                  </div>
                  <span style={{ ...s.rsvp, ...(g.rsvpStatus ? (g.rsvpStatus === "accepted" || g.rsvpStatus === "yes" ? s.rsvpYes : s.rsvpNo) : {}) }}>
                    {g.rsvpStatus ?? "no reply"}
                  </span>
                  <button type="button" style={s.copyBtn} onClick={() => void copyLink(g)}>
                    {copiedId === g.id ? "Copied ✓" : g.token ? "Copy personal link" : "Copy link"}
                  </button>
                  <button type="button" style={s.delBtn} title="Remove guest" onClick={() => void removeGuest(g.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
          <Link href={`/admin/guests?eventId=${eventId}`} style={s.ghostLink}>Open in global guest search →</Link>
        </div>
      </div>

      {/* RSVP summary */}
      <div style={s.side}>
        <div style={s.card}>
          <h2 style={s.h2}>RSVP</h2>
          <div style={s.statRow}><span style={s.statNum}>{stats.total}</span><span style={s.statLbl}>invited</span></div>
          <div style={s.statRow}><span style={{ ...s.statNum, color: "#15803d" }}>{stats.yes}</span><span style={s.statLbl}>accepted</span></div>
          <div style={s.statRow}><span style={{ ...s.statNum, color: "#b91c1c" }}>{stats.no}</span><span style={s.statLbl}>declined</span></div>
          <div style={s.statRow}><span style={s.statNum}>{pending}</span><span style={s.statLbl}>no reply yet</span></div>
          <p style={s.hint}>RSVPs arrive from the invitation&rsquo;s RSVP button once the event is published.</p>
        </div>
      </div>
      </div>
    </div>
  );
}

const s = {
  pageHead: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" as const, marginBottom: "1rem" },
  pageTitle: { margin: "0 0 0.2rem", fontSize: "1.3rem", fontWeight: 700, color: "var(--c-text)" },
  pageSub: { margin: 0, fontSize: "0.85rem", color: "var(--c-muted)", maxWidth: 520, lineHeight: 1.45 },
  backEditor: { padding: "0.45rem 0.9rem", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8, textDecoration: "none", color: "var(--c-text)", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" as const, flexShrink: 0 },
  wrap: { display: "flex", gap: "1.25rem", alignItems: "flex-start", flexWrap: "wrap" as const },
  main: { flex: 1, minWidth: 380, display: "flex", flexDirection: "column" as const, gap: "1rem" },
  side: { width: 260, flexShrink: 0 },
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "1.1rem", display: "flex", flexDirection: "column" as const, gap: "0.7rem" },
  h2: { margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--c-text)" },
  addRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" as const },
  input: { minWidth: 140, boxSizing: "border-box" as const, padding: "0.55rem 0.7rem", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", fontSize: "0.9rem", fontFamily: "inherit" },
  addBtn: { padding: "0.55rem 1.1rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 },
  err: { margin: 0, fontSize: "0.8rem", color: "#dc2626" },
  hint: { margin: 0, fontSize: "0.78rem", color: "var(--c-muted)", lineHeight: 1.45 },

  list: { display: "flex", flexDirection: "column" as const, gap: "0.4rem" },
  row: { display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.6rem", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-surface-2)" },
  gName: { fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)" },
  gContact: { fontSize: "0.72rem", color: "var(--c-muted)" },
  rsvp: { fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "0.2rem 0.55rem", borderRadius: 999, background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-muted)", flexShrink: 0 },
  rsvpYes: { background: "#dcfce7", borderColor: "#bbf7d0", color: "#15803d" },
  rsvpNo: { background: "#fee2e2", borderColor: "#fecaca", color: "#b91c1c" },
  copyBtn: { padding: "0.3rem 0.7rem", borderRadius: 7, border: "1px solid var(--c-border)", background: "var(--c-surface)", color: "var(--c-text)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  delBtn: { padding: "0.25rem 0.5rem", borderRadius: 6, border: "none", background: "transparent", color: "var(--c-muted)", cursor: "pointer", fontSize: "0.8rem", flexShrink: 0 },

  statRow: { display: "flex", alignItems: "baseline", gap: "0.5rem" },
  statNum: { fontSize: "1.3rem", fontWeight: 700, color: "var(--c-text)", minWidth: 34 },
  statLbl: { fontSize: "0.8rem", color: "var(--c-muted)" },

  ghostLink: { fontSize: "0.82rem", color: "var(--c-muted)", textDecoration: "none" },
} as const;
