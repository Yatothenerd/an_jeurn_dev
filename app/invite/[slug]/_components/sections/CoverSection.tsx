interface CoverContent {
  heading?: string;
  subheading?: string;
  guestLabel?: string;
}

interface Props {
  content: CoverContent;
  eventTitle: string;
  eventDate: string;
  guestName?: string | null;
  theme: { primary: string; accent: string; text: string; muted: string; font: string };
}

export function CoverSection({ content, eventTitle, eventDate, guestName, theme }: Props) {
  const date = new Date(eventDate);
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section style={{ ...s.section, fontFamily: theme.font }}>
      <div style={s.ornament}>✦ ✦ ✦</div>
      <h1 style={{ ...s.heading, color: theme.primary }}>
        {content.heading || eventTitle}
      </h1>
      {(content.subheading) && (
        <p style={{ ...s.subheading, color: theme.muted }}>{content.subheading}</p>
      )}

      {/* Personalized guest greeting (filled from the per-guest link) */}
      <div style={s.greeting}>
        <span style={{ ...s.greetingLabel, color: theme.accent, borderColor: theme.accent }}>
          ♥ {content.guestLabel || "Respected Guest"}
        </span>
        <div
          style={{
            ...s.greetingName,
            color: guestName ? theme.primary : theme.muted,
            borderColor: theme.accent,
            fontStyle: guestName ? "normal" : "italic",
          }}
        >
          {guestName ? guestName : `[ ${content.guestLabel || "Respected Guest"} ]`}
        </div>
      </div>

      <div style={{ ...s.divider, borderColor: theme.accent }} />
      <p style={{ ...s.date, color: theme.accent }}>{formatted}</p>
    </section>
  );
}

const s = {
  section: {
    padding: "4rem 1.5rem 3rem",
    textAlign: "center" as const,
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  ornament: { fontSize: "1rem", letterSpacing: "0.5rem", opacity: 0.4 },
  heading: {
    margin: 0,
    fontSize: "clamp(2rem, 8vw, 3.5rem)",
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: "0.02em",
  },
  subheading: {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: 300,
    letterSpacing: "0.05em",
  },
  greeting: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.625rem",
    width: "100%",
    maxWidth: "420px",
    margin: "0.5rem auto",
  },
  greetingLabel: {
    fontSize: "0.6875rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    padding: "0.3rem 0.9rem",
    border: "1px solid",
    borderRadius: "999px",
    opacity: 0.85,
  },
  greetingName: {
    width: "100%",
    padding: "0.85rem 1rem",
    border: "1px solid",
    borderRadius: "12px",
    fontSize: "1.125rem",
    letterSpacing: "0.02em",
    background: "rgba(255,255,255,0.04)",
  },
  divider: {
    width: "60px",
    borderTop: "1px solid",
    margin: "0.5rem auto",
  },
  date: {
    margin: 0,
    fontSize: "1rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
} as const;
