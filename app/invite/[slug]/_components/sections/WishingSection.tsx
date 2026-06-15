"use client";

import { useState } from "react";
import type { InviteWish } from "@/lib/utils/invite-cache";

interface Props {
  invitationId: string;
  initialWishes: InviteWish[];
  content: { placeholder?: string };
  theme: {
    primary: string;
    accent: string;
    text: string;
    muted: string;
    cardBg: string;
    border: string;
    btnBg: string;
    btnText: string;
    font: string;
  };
}

export function WishingSection({ invitationId, initialWishes, content, theme }: Props) {
  const [wishes, setWishes] = useState<InviteWish[]>(initialWishes);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, guestName: name.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to submit wish");
        return;
      }
      const { data } = await res.json();
      setWishes((w) => [{ ...data, createdAt: data.createdAt ?? new Date().toISOString() }, ...w]);
      setName("");
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ ...s.section, fontFamily: theme.font }}>
      <h2 style={{ ...s.heading, color: theme.primary }}>Wishing Wall</h2>

      <form onSubmit={handleSubmit} style={s.form}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          style={{ ...s.input, borderColor: theme.border, color: theme.primary, background: theme.cardBg }}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={content.placeholder || "Leave your wishes here…"}
          required
          rows={3}
          style={{ ...s.textarea, borderColor: theme.border, color: theme.primary, background: theme.cardBg }}
        />
        {error && <p style={s.error}>{error}</p>}
        {submitted && <p style={{ ...s.success, color: theme.accent }}>Wish submitted! 💌</p>}
        <button
          type="submit"
          disabled={submitting}
          style={{ ...s.btn, background: theme.btnBg, color: theme.btnText }}
        >
          {submitting ? "Sending…" : "Send Wish"}
        </button>
      </form>

      {wishes.length > 0 && (
        <div style={s.wishes}>
          {wishes.map((w) => (
            <div key={w.id} style={{ ...s.wish, background: theme.cardBg, border: `1px solid ${theme.border}` }}>
              <p style={{ ...s.wishMessage, color: theme.text }}>&ldquo;{w.message}&rdquo;</p>
              <p style={{ ...s.wishName, color: theme.accent }}>— {w.guestName}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const s = {
  section: { padding: "3rem 1.5rem", maxWidth: "480px", margin: "0 auto" },
  heading: { margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 400, textAlign: "center" as const },
  form: { display: "flex", flexDirection: "column" as const, gap: "0.75rem", marginBottom: "2rem" },
  input: {
    padding: "0.75rem 1rem",
    border: "1px solid",
    borderRadius: "10px",
    fontSize: "1rem",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  textarea: {
    padding: "0.75rem 1rem",
    border: "1px solid",
    borderRadius: "10px",
    fontSize: "1rem",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
  },
  btn: {
    padding: "0.875rem 1rem",
    border: "none",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  error: { margin: 0, color: "#dc2626", fontSize: "0.875rem" },
  success: { margin: 0, fontSize: "0.875rem", fontWeight: 500 },
  wishes: { display: "flex", flexDirection: "column" as const, gap: "0.875rem" },
  wish: { borderRadius: "12px", padding: "1.125rem 1.25rem" },
  wishMessage: { margin: "0 0 0.5rem", fontSize: "1rem", lineHeight: 1.6, fontStyle: "italic" },
  wishName: { margin: 0, fontSize: "0.875rem", fontWeight: 600 },
} as const;
