"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Guest {
  id: string;
  name: string;
  contact: string | null;
  contactType: string | null;
  rsvpStatus: string | null;
  mealPref: string | null;
  rsvpAt: string | null;
}

interface Props {
  eventId: string;
  initialGuests: Guest[];
  maxGuests: number;
  hasGuestControl: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  attending: { bg: "#dcfce7", text: "#166534" },
  declined: { bg: "#fee2e2", text: "#991b1b" },
  pending: { bg: "#f3f4f6", text: "#6b7280" },
};

export function GuestListClient({ eventId, initialGuests, maxGuests, hasGuestControl }: Props) {
  const router = useRouter();
  const [guests, setGuests] = useState(initialGuests);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState("phone");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

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
                {["Name", "Contact", "RSVP", "Meal", "Responded", ""].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => {
                const statusKey = g.rsvpStatus ?? "pending";
                const colors = STATUS_COLORS[statusKey] ?? STATUS_COLORS.pending;
                return (
                  <tr key={g.id} style={s.tr}>
                    <td style={s.td}>{g.name}</td>
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
  addBtn: { padding: "0.5rem 1rem", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 },
  addForm: { display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center" },
  saveBtn: { padding: "0.5rem 1rem", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, flexShrink: 0 },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: "0 0 0.75rem" },
  empty: { padding: "2rem", textAlign: "center" as const, color: "#94a3b8", background: "#f9fafb", borderRadius: "10px", fontSize: "0.9375rem" },
  tableWrap: { overflowX: "auto" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, background: "#fff", borderRadius: "10px", overflow: "hidden", border: "1px solid #e5e7eb" },
  th: { padding: "0.75rem 1rem", textAlign: "left" as const, fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "0.875rem 1rem", fontSize: "0.9375rem", color: "#0f172a", verticalAlign: "middle" as const },
  statusBadge: { padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "0.25rem", fontSize: "0.875rem" },
} as const;
