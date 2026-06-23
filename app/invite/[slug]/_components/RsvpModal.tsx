"use client";

import { useEffect, useState } from "react";

interface Props {
  eventId: string;
  hasGuestControl: boolean;
  theme: {
    primary: string;
    accent: string;
    muted: string;
    bg: string;
    cardBg: string;
    border: string;
    btnBg: string;
    btnText: string;
    font: string;
  };
}

export function RsvpModal({ eventId, hasGuestControl, theme }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState("phone");
  const [mealPref, setMealPref] = useState("");
  const [status, setStatus] = useState<"attending" | "declined">("attending");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Opened from the floating RSVP action button (InviteActions dispatches this).
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("anjeurn:open-rsvp", handler);
    return () => window.removeEventListener("anjeurn:open-rsvp", handler);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name: name.trim(), contact: contact.trim(), contactType, mealPref: mealPref.trim(), rsvpStatus: status }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed to submit RSVP"); return; }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    padding: "0.75rem 1rem",
    border: `1px solid ${theme.border}`,
    borderRadius: "10px",
    fontSize: "1rem",
    fontFamily: theme.font,
    background: theme.cardBg,
    color: theme.primary,
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
  };

  return (
    <>
      {/* RSVP is opened from the floating action button group (see InviteActions). */}

      {/* Modal overlay */}
      {open && (
        <div style={s.overlay} onClick={() => { if (!submitting) setOpen(false); }}>
          <div
            style={{ ...s.modal, background: theme.bg, fontFamily: theme.font }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={s.modalHeader}>
              <h2 style={{ ...s.modalTitle, color: theme.primary }}>RSVP</h2>
              <button onClick={() => setOpen(false)} style={s.closeBtn}>✕</button>
            </div>

            {done ? (
              <div style={s.success}>
                <div style={s.successIcon}>🎉</div>
                <p style={{ ...s.successText, color: theme.primary }}>
                  {status === "attending" ? "See you there!" : "Thank you for letting us know."}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  style={{ ...s.submitBtn, background: theme.btnBg, color: theme.btnText }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={s.form}>
                {hasGuestControl && (
                  <p style={{ ...s.hint, color: theme.muted }}>
                    Please enter your name exactly as it appears on the invitation.
                  </p>
                )}
                <div style={s.field}>
                  <label style={{ ...s.label, color: theme.muted }}>Full Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="Your full name" />
                </div>
                <div style={s.field}>
                  <label style={{ ...s.label, color: theme.muted }}>Contact (optional)</label>
                  <div style={s.contactRow}>
                    <select value={contactType} onChange={(e) => setContactType(e.target.value)} style={{ ...inputStyle, width: "120px", flexShrink: 0 }}>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                    <input value={contact} onChange={(e) => setContact(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Contact info" />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={{ ...s.label, color: theme.muted }}>Meal Preference (optional)</label>
                  <input value={mealPref} onChange={(e) => setMealPref(e.target.value)} style={inputStyle} placeholder="e.g. Vegetarian, Halal…" />
                </div>
                <div style={s.field}>
                  <label style={{ ...s.label, color: theme.muted }}>Attendance *</label>
                  <div style={s.statusRow}>
                    {(["attending", "declined"] as const).map((s2) => (
                      <button
                        key={s2}
                        type="button"
                        onClick={() => setStatus(s2)}
                        style={{
                          ...s.statusBtn,
                          background: status === s2 ? theme.btnBg : theme.cardBg,
                          color: status === s2 ? theme.btnText : theme.primary,
                          border: `1px solid ${status === s2 ? theme.btnBg : theme.border}`,
                        }}
                      >
                        {s2 === "attending" ? "✓ Attending" : "✕ Declined"}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <p style={{ color: "#dc2626", fontSize: "0.875rem", margin: 0 }}>{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...s.submitBtn, background: theme.btnBg, color: theme.btnText }}
                >
                  {submitting ? "Submitting…" : "Submit RSVP"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  stickyBar: {
    position: "fixed" as const,
    bottom: "1.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 100,
  },
  rsvpBtn: {
    padding: "0.875rem 2.5rem",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap" as const,
    minHeight: "48px",
  },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 200,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0",
  },
  modal: {
    width: "100%",
    maxWidth: "480px",
    borderRadius: "20px 20px 0 0",
    padding: "1.5rem",
    maxHeight: "90vh",
    overflowY: "auto" as const,
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  modalTitle: { margin: 0, fontSize: "1.25rem", fontWeight: 600 },
  closeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#94a3b8", padding: "0.25rem" },
  form: { display: "flex", flexDirection: "column" as const, gap: "1rem" },
  field: { display: "flex", flexDirection: "column" as const, gap: "0.375rem" },
  label: { fontSize: "0.8125rem", fontWeight: 500, letterSpacing: "0.02em" },
  hint: { margin: 0, fontSize: "0.8125rem", fontStyle: "italic" },
  contactRow: { display: "flex", gap: "0.5rem" },
  statusRow: { display: "flex", gap: "0.75rem" },
  statusBtn: { flex: 1, padding: "0.75rem 1rem", borderRadius: "10px", cursor: "pointer", fontSize: "0.9375rem", fontWeight: 600, minHeight: "44px" },
  submitBtn: { padding: "0.9rem 1rem", border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: 700, cursor: "pointer", marginTop: "0.25rem", minHeight: "48px" },
  success: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "1rem", padding: "1rem 0" },
  successIcon: { fontSize: "3rem" },
  successText: { margin: 0, fontSize: "1.25rem", fontWeight: 300, textAlign: "center" as const },
} as const;
