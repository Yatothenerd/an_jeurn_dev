import type { ThemeTokens } from "../../types";

interface CoverContent {
  heading?: string;
  subheading?: string;
  guestLabel?: string;
}

// Video-background cover. `assets.video` (mp4) plays behind a scrim; if absent
// the theme's cover gradient shows through, so it degrades cleanly.
export function CinematicCover({
  content,
  eventTitle,
  eventDate,
  venueName,
  guestName,
  theme,
  assets,
}: {
  content: CoverContent;
  eventTitle: string;
  eventDate: string;
  venueName?: string | null;
  guestName?: string | null;
  theme: ThemeTokens;
  assets?: Record<string, string>;
}) {
  const formatted = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const label = content.guestLabel || "Respected Guest";
  const video = assets?.video;
  const poster = assets?.poster;

  return (
    <section className="cin-cover" style={{ fontFamily: theme.font, background: theme.coverGradient }}>
      {video && (
        <video className="cin-bg" autoPlay muted loop playsInline poster={poster} preload="none">
          <source src={video} type="video/mp4" />
        </video>
      )}
      <div className="cin-overlay" />

      <div className="cin-content">
        <p className="inv-pretitle" style={{ color: theme.accent }}>{content.subheading || "You are cordially invited"}</p>
        <div className="inv-script" style={{ color: "#fff" }}>{content.heading || eventTitle}</div>

        <div className="inv-ornament-line" style={{ color: theme.accent }}>
          <div className="line" />
          <span className="gem">{theme.gem}</span>
          <div className="line" />
        </div>

        <div className="inv-greeting">
          <span className="inv-greeting-label" style={{ color: theme.accent, borderColor: theme.accent }}>♥ {label}</span>
          <div
            className="inv-greeting-name"
            style={{ color: "#fff", borderColor: theme.accent, fontStyle: guestName ? "normal" : "italic" }}
          >
            {guestName ? guestName : `[ ${label} ]`}
          </div>
        </div>

        <p className="inv-date" style={{ color: theme.accent }}>{formatted}</p>
        {venueName && <p className="inv-venue-snippet" style={{ color: "rgba(255,255,255,0.7)" }}>{venueName}</p>}
      </div>
    </section>
  );
}
