"use client";

import type { InviteWish } from "@/lib/utils/invite-cache";
import type { ThemeTokens } from "@/lib/themes/types";
import { useWishForm } from "@/lib/themes/shared/use-wish-form";

interface Props {
  invitationId: string;
  initialWishes: InviteWish[];
  content: { placeholder?: string; title?: string };
  theme: ThemeTokens;
}

export function WishingSection({ invitationId, initialWishes, content, theme }: Props) {
  const { wishes, name, setName, message, setMessage, submitting, submitted, error, handleSubmit } = useWishForm(
    invitationId,
    initialWishes
  );

  return (
    <section className="inv-section" style={{ fontFamily: theme.font }}>
      <div className="inv-section-title" style={{ color: theme.primary }}>
        <div className="line" /><span>{content.title || "Wishes"}</span><div className="line" />
      </div>
      <form onSubmit={handleSubmit} className="inv-wish-form" style={{ marginBottom: "1.25rem" }}>
        <input
          className="inv-wish-input"
          style={{ borderColor: theme.border, color: theme.primary, background: theme.cardBg }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
        <textarea
          className="inv-wish-input"
          style={{ borderColor: theme.border, color: theme.primary, background: theme.cardBg, resize: "vertical" }}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={content.placeholder || "Leave your wishes here…"}
          required
        />
        {error && <p style={{ margin: 0, color: "#dc2626", fontSize: "0.85rem" }}>{error}</p>}
        {submitted && <p style={{ margin: 0, color: theme.accent, fontSize: "0.85rem" }}>Wish submitted! 💌</p>}
        <button className="inv-wish-send" type="submit" disabled={submitting} style={{ background: theme.btnBg, color: theme.btnText }}>
          {submitting ? "Sending…" : "Send Wish"}
        </button>
      </form>

      {wishes.length > 0 && (
        <div>
          {wishes.map((w) => (
            <div key={w.id} className="inv-wish" style={{ background: theme.cardBg, borderColor: theme.border }}>
              <p className="inv-wish-msg" style={{ color: theme.text }}>&ldquo;{w.message}&rdquo;</p>
              <p className="inv-wish-from" style={{ color: theme.accent }}>— {w.guestName}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
