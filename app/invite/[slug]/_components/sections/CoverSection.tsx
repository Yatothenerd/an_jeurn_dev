import type { ThemeTokens } from "@/lib/themes/types";

interface CoverContent {
  heading?: string;
  subheading?: string;
  guestLabel?: string;
  /** Uploaded monogram / logo — displayed prominently at the top of the cover. */
  logoUrl?: string;
}

interface Props {
  content: CoverContent;
  eventTitle: string;
  eventDate: string;
  venueName?: string | null;
  guestName?: string | null;
  theme: ThemeTokens;
  assets?: Record<string, string>;
}

export function CoverSection({ content, eventTitle, eventDate, venueName, guestName, theme, assets }: Props) {
  // Monogram = the uploaded logo only (no fallback to the cover image), gated
  // by the "show monogram on sections" toggle.
  const monogramUrl = theme.showMonogramInSections && content.logoUrl ? content.logoUrl : null;
  const date = new Date(eventDate);
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const label = content.guestLabel || "Respected Guest";

  const damask = theme.cornerStyle === "damask";
  const cornerClass = damask ? "inv-corner-orn" : "inv-corner";
  const cornerPos = damask
    ? ["orn-tl", "orn-tr", "orn-bl", "orn-br"]
    : ["tl", "tr", "bl", "br"];

  return (
    <section
      className="inv-cover"
      style={{ background: theme.coverGradient, fontFamily: theme.font, color: theme.text }}
    >
      {cornerPos.map((pos) => (
        <span key={pos} className={`${cornerClass} ${pos}`} style={{ color: theme.accent }} />
      ))}

      {monogramUrl && (
        <img src={monogramUrl} alt="Monogram" className="inv-monogram" style={{ border: `2px solid ${theme.accent}55` }} />
      )}

      <p className="inv-pretitle" style={{ color: theme.accent }}>
        {content.subheading || "You are cordially invited"}
      </p>
      <div className="inv-script" style={{ color: theme.primary }}>
        {content.heading || eventTitle}
      </div>

      <div className="inv-ornament-line" style={{ color: theme.accent }}>
        <div className="line" />
        <span className="gem">{theme.gem}</span>
        <div className="line" />
      </div>

      {/* Personalized guest greeting (filled from the per-guest link) */}
      <div className="inv-greeting">
        <span className="inv-greeting-label" style={{ color: theme.accent, borderColor: theme.accent }}>
          ♥ {label}
        </span>
        <div
          className="inv-greeting-name"
          style={{
            color: guestName ? theme.primary : theme.muted,
            borderColor: theme.accent,
            fontStyle: guestName ? "normal" : "italic",
          }}
        >
          {guestName ? guestName : `[ ${label} ]`}
        </div>
      </div>

      <p className="inv-date" style={{ color: theme.accent }}>{formatted}</p>
      {venueName && <p className="inv-venue-snippet" style={{ color: theme.muted }}>{venueName}</p>}
    </section>
  );
}
