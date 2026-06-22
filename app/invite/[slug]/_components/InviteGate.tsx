"use client";

import { useEffect, useState } from "react";
import type { ThemeTokens } from "@/lib/themes/types";

interface Props {
  eventTitle: string;
  guestName: string | null;
  /** Greeting fallback when there's no personalized guest (no ?g= token). */
  guestLabel?: string;
  theme: ThemeTokens;
  /** Cover or background image shown as the gate's full-screen backdrop. */
  bgUrl?: string | null;
  /** Monogram / cover circle image shown at the top of the gate. */
  coverUrl?: string | null;
  children: React.ReactNode;
}

// Universal opening "envelope" that wraps every invitation: a landing page
// (event title + guest greeting + Open Letter button), then the letter itself,
// then a one-time scroll-guide overlay.
export function InviteGate({ eventTitle, guestName, guestLabel, theme, bgUrl, coverUrl, children }: Props) {
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
          style={{
            fontFamily: theme.font,
            color: theme.text,
            ...(bgUrl
              ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: theme.coverGradient }),
          }}
        >
          {/* Scrim over image so text stays readable */}
          {bgUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />}

          {/* TOP ZONE: monogram or pretitle */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Monogram"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow: "0 4px 28px rgba(0,0,0,0.5)",
                }}
              />
            ) : null}
            <p className="inv-pretitle" style={{ color: theme.accent, margin: 0 }}>You are invited to</p>
          </div>

          {/* MIDDLE ZONE: event title + ornament */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div className="inv-script" style={{ color: theme.primary }}>{eventTitle}</div>
            <div className="inv-ornament-line" style={{ color: theme.accent }}>
              <div className="line" />
              {theme.gem && <span className="gem">{theme.gem}</span>}
              <div className="line" />
            </div>
          </div>

          {/* BOTTOM ZONE: guest greeting + open button */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "1.1rem" }}>
            <div className="inv-gate-guest">
              <span className="inv-greeting-label" style={{ color: theme.accent, borderColor: theme.accent }}>
                ♥ Dear
              </span>
              <div className="inv-gate-name" style={{ color: theme.primary }}>{label}</div>
            </div>
            <button className="inv-gate-open" onClick={open} aria-label="Open invitation">
              <img className="inv-gate-hand" src="/hand.webp" alt="" />
              <span className="inv-gate-open-label" style={{ color: theme.accent, borderColor: theme.accent }}>
                Open Letter
              </span>
            </button>
          </div>
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
