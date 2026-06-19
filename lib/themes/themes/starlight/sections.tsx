"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeTokens } from "../../types";

// Scroll-triggered fade-up wrapper. Used by the Starlight layout to reveal each
// section as it enters the viewport.
export function Reveal({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`sl-reveal${visible ? " is-visible" : ""}`} style={style}>
      {children}
    </div>
  );
}

interface CoverContent {
  heading?: string;
  subheading?: string;
  guestLabel?: string;
}

// Deterministic star positions so SSR and client markup match (no Math.random).
const STARS = Array.from({ length: 44 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 61) % 100,
  size: (i % 3) + 1,
  delay: ((i % 6) * 0.5).toFixed(1),
}));

export function StarlightCover({
  content,
  eventTitle,
  eventDate,
  venueName,
  guestName,
  theme,
}: {
  content: CoverContent;
  eventTitle: string;
  eventDate: string;
  venueName?: string | null;
  guestName?: string | null;
  theme: ThemeTokens;
}) {
  const formatted = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const label = content.guestLabel || "Respected Guest";

  return (
    <section className="sl-cover" style={{ fontFamily: theme.font, color: theme.text }}>
      {STARS.map((s, i) => (
        <span
          key={i}
          className="sl-star"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}

      <p className="inv-pretitle" style={{ color: theme.accent }}>{content.subheading || "Under the stars"}</p>
      <div className="inv-script" style={{ color: theme.primary }}>{content.heading || eventTitle}</div>

      <div className="inv-ornament-line" style={{ color: theme.accent }}>
        <div className="line" />
        <span className="gem">{theme.gem}</span>
        <div className="line" />
      </div>

      <div className="inv-greeting">
        <span className="inv-greeting-label" style={{ color: theme.accent, borderColor: theme.accent }}>✦ {label}</span>
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
