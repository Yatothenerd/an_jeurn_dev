"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Guest {
  id: string;
  name: string;
  token: string | null;
  contact: string | null;
  contactType: string | null;
  rsvpStatus: string | null;
  mealPref: string | null;
  rsvpAt: string | null;
}

interface Props {
  eventId: string;
  eventTitle: string;
  inviteBaseUrl: string;
  initialGuests: Guest[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  attending: { bg: "#dcfce7", text: "#166534" },
  declined: { bg: "#fee2e2", text: "#991b1b" },
  pending: { bg: "var(--c-surface-2)", text: "var(--c-muted)" },
};

export function GuestListClient({ eventId, eventTitle, inviteBaseUrl, initialGuests }: Props) {
  const router = useRouter();
  const [guests, setGuests] = useState(initialGuests);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState("phone");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function guestLink(token: string | null): string {
    return token ? `${inviteBaseUrl}?g=${token}` : inviteBaseUrl;
  }
  function shareText(g: Guest): string {
    return `${g.name}, you're invited to ${eventTitle} 💌`;
  }

  async function copyLink(guest: Guest) {
    try {
      await navigator.clipboard.writeText(guestLink(guest.token));
      setCopied(guest.id);
      setTimeout(() => setCopied((c) => (c === guest.id ? null : c)), 1500);
    } catch {
      window.prompt("Copy this guest's invite link:", guestLink(guest.token));
    }
  }
  function openInvite(guest: Guest) {
    window.open(guestLink(guest.token), "_blank", "noopener,noreferrer");
  }
  function shareTelegram(guest: Guest) {
    const url = `https://t.me/share/url?url=${encodeURIComponent(guestLink(guest.token))}&text=${encodeURIComponent(shareText(guest))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
  async function shareTo(guest: Guest) {
    const data = { title: eventTitle, text: shareText(guest), url: guestLink(guest.token) };
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share(data); return; } catch { return; }
    }
    copyLink(guest);
  }

  function startEdit(guest: Guest) { setEditingId(guest.id); setEditName(guest.name); }
  function cancelEdit() { setEditingId(null); setEditName(""); }
  async function saveEdit(guest: Guest) {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === guest.name) { cancelEdit(); return; }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/dashboard/events/${eventId}/guests/${guest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setGuests((gs) => gs.map((x) => (x.id === guest.id ? { ...x, name: trimmed } : x)));
        cancelEdit();
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch(`/api/dashboard/events/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim() || undefined, contactType }),
      });
      const d = await res.json();
      if (!res.ok) { setAddError(d.error ?? "Failed to add guest"); return; }
      setGuests((g) => [{ ...d.data, rsvpStatus: null, mealPref: null, rsvpAt: null }, ...g]);
      setName(""); setContact(""); setShowAdd(false);
    } catch {
      setAddError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(guestId: string) {
    if (!confirm("Remove this guest?")) return;
    setDeleting(guestId);
    await fetch(`/api/dashboard/events/${eventId}/guests/${guestId}`, { method: "DELETE" });
    setGuests((g) => g.filter((x) => x.id !== guestId));
    setDeleting(null);
    router.refresh();
  }

  const inp = {
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--c-border)",
    background: "transparent",
    color: "var(--c-text)",
    borderRadius: "7px",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <div>
      <div style={s.toolbar}>
        <h2 style={s.sectionTitle}>Guest list</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={s.addBtn}>
          {showAdd ? "Cancel" : "+ Add Guest"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={s.addForm}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" required style={{ ...inp, flex: 2, minWidth: "160px" }} />
          <select value={contactType} onChange={(e) => setContactType(e.target.value)} style={{ ...inp, flex: "0 0 110px" }}>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact" style={{ ...inp, flex: 2, minWidth: "140px" }} />
          <button type="submit" disabled={adding} style={s.saveBtn}>{adding ? "Adding…" : "Add"}</button>
        </form>
      )}
      {addError && <p style={s.error}>{addError}</p>}

      {guests.length === 0 ? (
        <div style={s.empty}>No guests yet. Add guests manually or they will appear after RSVPing.</div>
      ) : (
        <>
        <div className="guest-table-desktop">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>RSVP Status</th>
                <th className="col-hide-sm">Date</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => {
                const statusKey = g.rsvpStatus ?? "pending";
                const colors = STATUS_COLORS[statusKey] ?? STATUS_COLORS.pending;
                const editing = editingId === g.id;
                return (
                  <tr key={g.id}>
                    <td data-label="Name">
                      {editing ? (
                        <span style={s.editWrap}>
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(g);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            style={{ ...inp, padding: "0.35rem 0.5rem", width: "auto" }}
                          />
                          <button onClick={() => saveEdit(g)} disabled={savingEdit} style={s.iconOk} title="Save">✓</button>
                          <button onClick={cancelEdit} style={s.iconCancel} title="Cancel">✕</button>
                        </span>
                      ) : (
                        <span style={s.nameWrap}>
                          {g.name}
                          <button onClick={() => startEdit(g)} style={s.editBtn} title="Edit name">✎</button>
                        </span>
                      )}
                    </td>
                    <td data-label="Contact" style={{ color: "var(--c-muted)" }}>
                      {g.contact ? `${g.contactType ? `[${g.contactType}] ` : ""}${g.contact}` : "—"}
                    </td>
                    <td data-label="RSVP">
                      <span className="status-pill" style={{ background: colors.bg, color: colors.text, textTransform: "capitalize" }}>
                        {statusKey}
                      </span>
                    </td>
                    <td data-label="Date" className="col-hide-sm" style={{ color: "var(--c-muted)", fontSize: "0.8125rem" }}>
                      {g.rsvpAt ? new Date(g.rsvpAt).toLocaleDateString() : "—"}
                    </td>
                    <td data-label="Actions" className="actions">
                      <div className="icon-actions">
                        <button onClick={() => openInvite(g)} className="icon-btn" title="Open the guest's invite to test" aria-label="Open invite">👁</button>
                        <button onClick={() => shareTelegram(g)} className="icon-btn tg" title="Share to Telegram" aria-label="Share to Telegram">✈</button>
                        <button onClick={() => shareTo(g)} className="icon-btn" title="Share to…" aria-label="Share">↗</button>
                        <button onClick={() => copyLink(g)} className="icon-btn" title={guestLink(g.token)} aria-label="Copy link">{copied === g.id ? "✓" : "🔗"}</button>
                        <button onClick={() => handleDelete(g.id)} disabled={deleting === g.id} className="icon-btn danger" title="Remove guest" aria-label="Remove guest">✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>

        {/* Compact mobile cards */}
        <div className="guest-cards">
          {guests.map((g) => {
            const statusKey = g.rsvpStatus ?? "pending";
            const colors = STATUS_COLORS[statusKey] ?? STATUS_COLORS.pending;
            const editing = editingId === g.id;
            return (
              <div key={g.id} className="guest-card">
                <div className="guest-card-top">
                  {editing ? (
                    <span style={s.editWrap}>
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(g);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        style={{ ...inp, padding: "0.35rem 0.5rem" }}
                      />
                      <button onClick={() => saveEdit(g)} disabled={savingEdit} style={s.iconOk} title="Save">✓</button>
                      <button onClick={cancelEdit} style={s.iconCancel} title="Cancel">✕</button>
                    </span>
                  ) : (
                    <span className="guest-card-name">{g.name}</span>
                  )}
                  <span className="status-pill" style={{ background: colors.bg, color: colors.text, textTransform: "capitalize" }}>
                    {statusKey}
                  </span>
                </div>
                <div className="guest-card-meta">
                  <span>{g.contact ? `${g.contactType ? `[${g.contactType}] ` : ""}${g.contact}` : "No contact"}</span>
                  <span>{g.rsvpAt ? new Date(g.rsvpAt).toLocaleDateString() : "—"}</span>
                </div>
                <div className="guest-card-actions">
                  {!editing && <button onClick={() => startEdit(g)} className="icon-btn" title="Edit name" aria-label="Edit name">✎</button>}
                  <button onClick={() => openInvite(g)} className="icon-btn" title="Open invite" aria-label="Open invite">👁</button>
                  <button onClick={() => shareTelegram(g)} className="icon-btn tg" title="Telegram" aria-label="Telegram">✈</button>
                  <button onClick={() => shareTo(g)} className="icon-btn" title="Share" aria-label="Share">↗</button>
                  <button onClick={() => copyLink(g)} className="icon-btn" title="Copy link" aria-label="Copy link">{copied === g.id ? "✓" : "🔗"}</button>
                  <button onClick={() => handleDelete(g.id)} disabled={deleting === g.id} className="icon-btn danger" title="Remove" aria-label="Remove">✕</button>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}

const s = {
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "0.75rem", flexWrap: "wrap" as const },
  sectionTitle: { margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--c-text)", display: "flex", alignItems: "center", gap: "0.5rem" },
  badge: { padding: "0.125rem 0.5rem", background: "var(--c-accent-soft)", color: "var(--c-accent)", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500 },
  addForm: { display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center", flexWrap: "wrap" as const },
  addBtn: { padding: "0.5rem 1rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 },
  saveBtn: { padding: "0.5rem 1rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, flexShrink: 0 },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: "0 0 0.75rem" },
  empty: { padding: "2rem", textAlign: "center" as const, color: "var(--c-muted)", background: "var(--c-surface-2)", borderRadius: "10px", fontSize: "0.9375rem" },
  nameWrap: { display: "inline-flex", alignItems: "center", gap: "0.4rem" },
  editWrap: { display: "inline-flex", alignItems: "center", gap: "0.3rem" },
  editBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", fontSize: "0.8125rem", padding: "0.1rem 0.2rem" },
  iconOk: { background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem", padding: "0.25rem 0.45rem" },
  iconCancel: { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem", padding: "0.25rem 0.45rem" },
  actions: { display: "flex", gap: "0.35rem", flexWrap: "wrap" as const, justifyContent: "flex-end" },
  actionBtn: { background: "var(--c-accent-soft)", border: "1px solid transparent", color: "var(--c-accent)", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, padding: "0.3rem 0.55rem", whiteSpace: "nowrap" as const },
  tgBtn: { background: "#1d6fa5", border: "1px solid #1d6fa5", color: "#fff" },
  deleteBtn: { background: "none", border: "1px solid var(--c-border)", cursor: "pointer", color: "var(--c-muted)", padding: "0.3rem 0.5rem", fontSize: "0.8rem", borderRadius: "6px" },
} as const;
