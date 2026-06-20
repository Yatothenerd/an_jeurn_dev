import type { ThemeTokens } from "@/lib/themes/types";

interface GuestRow {
  name: string;
  rsvpStatus: string | null;
}

interface Props {
  content: { title?: string };
  guests: GuestRow[];
  /** Names are only shown when the visitor opened their personal (?g=) link. */
  showNames: boolean;
  theme: ThemeTokens;
}

const PILL: Record<string, { bg: string; color: string; label: string }> = {
  attending: { bg: "#dcfce7", color: "#166534", label: "Attending" },
  declined: { bg: "#fee2e2", color: "#991b1b", label: "Declined" },
  pending: { bg: "rgba(255,255,255,0.12)", color: "inherit", label: "Pending" },
};

// Live guestlist widget. Counts are always public; the full name list renders
// only via a personal link (privacy). Data is read fresh from the API.
export function GuestlistSection({ content, guests, showNames, theme }: Props) {
  const attending = guests.filter((g) => g.rsvpStatus === "attending").length;
  const declined = guests.filter((g) => g.rsvpStatus === "declined").length;
  const pending = guests.filter((g) => !g.rsvpStatus).length;
  const counts = [
    { label: "Attending", value: attending },
    { label: "Declined", value: declined },
    { label: "Pending", value: pending },
  ];

  return (
    <section className="inv-section" style={{ fontFamily: theme.font }}>
      <div className="inv-section-title" style={{ color: theme.primary }}>
        <div className="line" /><span>{content.title || "Guest List"}</span><div className="line" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
        {counts.map((c) => (
          <div key={c.label} style={{ textAlign: "center", padding: "0.9rem 0.5rem", borderRadius: "12px", border: `1px solid ${theme.border}`, background: theme.cardBg }}>
            <div style={{ fontFamily: theme.font, fontSize: "1.6rem", fontWeight: 700, color: theme.primary, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: theme.muted, marginTop: "0.35rem" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {showNames ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "1rem" }}>
          {guests.map((g, i) => {
            const p = PILL[g.rsvpStatus ?? "pending"] ?? PILL.pending;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", padding: "0.55rem 0.85rem", borderRadius: "10px", border: `1px solid ${theme.border}`, background: theme.cardBg }}>
                <span style={{ color: theme.text, fontSize: "0.9rem" }}>{g.name}</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0.15rem 0.55rem", borderRadius: "999px", background: p.bg, color: p.color === "inherit" ? theme.muted : p.color }}>
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: theme.muted, fontSize: "0.8rem", margin: "0.85rem 0 0", fontStyle: "italic" }}>
          Open your personal invitation link to see the full guest list.
        </p>
      )}
    </section>
  );
}
