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
  maxGuests: number;
  hasGuestControl: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  attending: { bg: "#dcfce7", text: "#166534" },
  declined: { bg: "#fee2e2", text: "#991b1b" },
  pending: { bg: "#f3f4f6", text: "#6b7280" },
};

export function GuestListClient({ eventId, eventTitle, inviteBaseUrl, initialGuests, maxGuests, hasGuestControl }: Props) {
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

  // Inline name editing
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

  // Open the guest's personalized invite in a new tab (to test the name view).
  function openInvite(guest: Guest) {
    window.open(guestLink(guest.token), "_blank", "noopener,noreferrer");
  }

  // Telegram's share intent — opens Telegram with the link + greeting prefilled.
  function shareTelegram(guest: Guest) {
    const url = `https://t.me/share/url?url=${encodeURIComponent(guestLink(guest.token))}&text=${encodeURIComponent(shareText(guest))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // Native OS share sheet (lets the user pick any app); falls back to copy.
  async function shareTo(guest: Guest) {
    const data = { title: eventTitle, text: shareText(guest), url: guestLink(guest.token) };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    copyLink(guest);
  }

  function startEdit(guest: Guest) {
    setEditingId(guest.id);
    setEditName(guest.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function saveEdit(guest: Guest) {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === guest.name) {
      cancelEdit();
      return;
    }
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
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <div>
      {/* Add Guest */}
      <div style={s.toolbar}>
        <h2 style={s.sectionTitle}>
          {guests.length} guests {maxGuests > 0 ? `/ ${maxGuests}` : ""}
          {hasGuestControl && <span style={s.badge}>Guest Control ON</span>}
        </h2>
        <button onClick={() => setShowAdd(!showAdd)} style={s.addBtn}>
          {showAdd ? "Cancel" : "+ Add Guest"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={s.addForm}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" required style={{ ...inp, flex: 2 }} />
          <select value={contactType} onChange={(e) => setContactType(e.target.value)} style={{ ...inp, flex: "0 0 110px" }}>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact" style={{ ...inp, flex: 2 }} />
          <button type="submit" disabled={adding} style={s.saveBtn}>{adding ? "Adding…" : "Add"}</button>
        </form>
      )}
      {addError && <p style={s.error}>{addError}</p>}

      {/* Guest Table */}
      {guests.length === 0 ? (
        <div style={s.empty}>No guests yet. Add guests manually or they will appear after RSVPing.</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Name", "Contact", "RSVP", "Meal", "Responded", "Share", ""].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => {
                const statusKey = g.rsvpStatus ?? "pending";
                const colors = STATUS_COLORS[statusKey] ?? STATUS_COLORS.pending;
                const editing = editingId === g.id;
                return (
                  <tr key={g.id} style={s.tr}>
                    <td style={s.td}>
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
                        <span style={s.nameWrap}>
                          {g.name}
                          <button onClick={() => startEdit(g)} style={s.editBtn} title="Edit name">✎</button>
                        </span>
                      )}
                    </td>
                    <td style={{ ...s.td, color: "#6b7280" }}>
                      {g.contact ? `${g.contactType ? `[${g.contactType}] ` : ""}${g.contact}` : "—"}
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, background: colors.bg, color: colors.text }}>
                        {statusKey}
                      </span>
                    </td>
                    <td style={{ ...s.td, color: "#6b7280" }}>{g.mealPref ?? "—"}</td>
                    <td style={{ ...s.td, color: "#6b7280", fontSize: "0.75rem" }}>
                      {g.rsvpAt ? new Date(g.rsvpAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button onClick={() => openInvite(g)} style={s.actionBtn} title="Open the guest's invite to test">👁 Open</button>
                        <button onClick={() => shareTelegram(g)} style={{ ...s.actionBtn, ...s.tgBtn }} title="Share to Telegram">✈ Telegram</button>
                        <button onClick={() => shareTo(g)} style={s.actionBtn} title="Share to…">↗ Share</button>
                        <button onClick={() => copyLink(g)} style={s.actionBtn} title={guestLink(g.token)}>
                          {copied === g.id ? "✓ Copied" : "🔗 Copy"}
                        </button>
                      </div>
                    </td>
                    <td style={s.td}>
                      <button
                        onClick={() => handleDelete(g.id)}
                        disabled={deleting === g.id}
                        style={s.deleteBtn}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  sectionTitle: { margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" },
  badge: { padding: "0.125rem 0.5rem", background: "#ede9fe", color: "#5b21b6", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500 },
  addForm: { display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center", flexWrap: "wrap" as const },
  addBtn: { padding: "0.5rem 1rem", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 },
  saveBtn: { padding: "0.5rem 1rem", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, flexShrink: 0 },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: "0 0 0.75rem" },
  empty: { padding: "2rem", textAlign: "center" as const, color: "#94a3b8", background: "#f9fafb", borderRadius: "10px", fontSize: "0.9375rem" },
  tableWrap: { overflowX: "auto" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, background: "#fff", borderRadius: "10px", overflow: "hidden", border: "1px solid #e5e7eb" },
  th: { padding: "0.75rem 1rem", textAlign: "left" as const, fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "0.875rem 1rem", fontSize: "0.9375rem", color: "#0f172a", verticalAlign: "middle" as const },
  nameWrap: { display: "inline-flex", alignItems: "center", gap: "0.4rem" },
  editWrap: { display: "inline-flex", alignItems: "center", gap: "0.3rem" },
  editBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "0.8125rem", padding: "0.1rem 0.2rem" },
  iconOk: { background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem", padding: "0.25rem 0.45rem" },
  iconCancel: { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem", padding: "0.25rem 0.45rem" },
  statusBadge: { padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "0.25rem", fontSize: "0.875rem" },
  actions: { display: "flex", gap: "0.35rem", flexWrap: "wrap" as const },
  actionBtn: { background: "#f5f3ff", border: "1px solid #ede9fe", color: "#7c3aed", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, padding: "0.3rem 0.55rem", whiteSpace: "nowrap" as const },
  tgBtn: { background: "#e6f3fb", border: "1px solid #cce7f6", color: "#1d6fa5" },
} as const;
