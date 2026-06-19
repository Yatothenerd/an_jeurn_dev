"use client";

import { useEffect, useState } from "react";
import type { ThemeTokens } from "@/lib/themes/types";

interface Props {
  eventTitle: string;
  guestName: string | null;
  /** Greeting fallback when there's no personalized guest (no ?g= token). */
  guestLabel?: string;
  theme: ThemeTokens;
  children: React.ReactNode;
}

// Universal opening "envelope" that wraps every theme: a landing page (event +
// guest name + a hand button to open), then the letter itself, then a one-time
// scroll-guide overlay nudging the guest down through the content.
export function InviteGate({ eventTitle, guestName, guestLabel, theme, children }: Props) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const [guide, setGuide] = useState(false);

  // Lock page scroll until the letter is opened.
  useEffect(() => {
    if (phase === "open") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  function open() {
    if (phase !== "closed") return;
    setPhase("opening");
    // Let the gate animate out before unlocking + showing the guide.
    setTimeout(() => {
      setPhase("open");
      if (!sessionStorage.getItem("inv-guide-seen")) {
        setGuide(true);
        sessionStorage.setItem("inv-guide-seen", "1");
      }
    }, 700);
  }

  // The guide dismisses on the first scroll, a tap, or after a few seconds.
  useEffect(() => {
    if (!guide) return;
    const hide = () => setGuide(false);
    window.addEventListener("scroll", hide, { passive: true, once: true });
    const t = setTimeout(hide, 4000);
    return () => {
      window.removeEventListener("scroll", hide);
      clearTimeout(t);
    };
  }, [guide]);

  const label = guestName || guestLabel || "Dear Guest";

  return (
    <>
      {children}

      {phase !== "open" && (
        <div
          className={`inv-gate${phase === "opening" ? " is-opening" : ""}`}
          style={{ background: theme.coverGradient, fontFamily: theme.font, color: theme.text }}
        >
          <p className="inv-pretitle" style={{ color: theme.accent }}>You are invited to</p>
          <div className="inv-script" style={{ color: theme.primary }}>{eventTitle}</div>

          <div className="inv-ornament-line" style={{ color: theme.accent }}>
            <div className="line" />
            <span className="gem">{theme.gem}</span>
            <div className="line" />
          </div>

          <div className="inv-gate-guest">
            <span className="inv-greeting-label" style={{ color: theme.accent, borderColor: theme.accent }}>
              ♥ Dear
            </span>
            <div className="inv-gate-name" style={{ color: theme.primary }}>{label}</div>
          </div>

          <button className="inv-gate-open" onClick={open} aria-label="Open invitation">
            <img className="inv-gate-hand" src="/hand.webp" alt="" />
            <span className="inv-gate-open-label" style={{ color: theme.accent, borderColor: theme.accent }}>
              Tap to open
            </span>
          </button>
        </div>
      )}

      {guide && (
        <div className="inv-guide" onClick={() => setGuide(false)} role="button" aria-label="Dismiss guide">
          <img className="inv-guide-hand" src="/hand.webp" alt="" />
          <p className="inv-guide-text">Scroll to explore</p>
        </div>
      )}
    </>
  );
}
