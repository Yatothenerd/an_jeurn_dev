"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeTokens } from "@/lib/themes/types";
import { HandPointer } from "./HandPointer";

type ElemKey = "monogram" | "pretitle" | "title" | "subtitle" | "guestName" | "openBtn";
export type ElementPositions = Partial<Record<ElemKey, { xPct: number; yPct: number }>>;

const DEFAULT_POSITIONS: Record<ElemKey, { xPct: number; yPct: number }> = {
  monogram:  { xPct: 50, yPct: 11 },
  pretitle:  { xPct: 50, yPct: 22 },
  title:     { xPct: 50, yPct: 36 },
  subtitle:  { xPct: 50, yPct: 49 },
  guestName: { xPct: 50, yPct: 70 },
  openBtn:   { xPct: 50, yPct: 85 },
};

interface Props {
  eventTitle: string;
  guestName: string | null;
  guestLabel?: string;
  theme: ThemeTokens;
  bgUrl?: string | null;
  coverUrl?: string | null;
  gateOverlay?: { enabled: boolean; color: string; opacity: number };
  revealStyle?: "fade" | "envelope" | "curtain" | "slideUp";
  position?: "top" | "center" | "bottom";
  blur?: number;
  showGuestName?: boolean;
  guestFrameUrl?: string | null;
  showMonogram?: boolean;
  elementPositions?: ElementPositions;
  children: React.ReactNode;
}

export function InviteGate({
  eventTitle, guestName, guestLabel, theme, bgUrl, coverUrl, gateOverlay,
  revealStyle = "fade",
  position = "center", blur = 0,
  showGuestName = true, guestFrameUrl, showMonogram = true,
  elementPositions,
  children,
}: Props) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const [guide, setGuide] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "open") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [phase]);

  function open() {
    if (phase !== "closed") return;
    setPhase("opening");
    setTimeout(() => {
      setPhase("open");
      // Trigger section entrance animations now that gate is dismissed
      shellRef.current?.classList.add("inv-animate");
      if (!sessionStorage.getItem("inv-guide-seen")) {
        setGuide(true);
        sessionStorage.setItem("inv-guide-seen", "1");
      }
    }, 850);
  }

  const hasCustomPos = !!elementPositions && Object.keys(elementPositions).length > 0;

  function ep(key: ElemKey): React.CSSProperties {
    const pos = elementPositions?.[key] ?? DEFAULT_POSITIONS[key];
    return {
      position: "absolute",
      left: pos.xPct + "%",
      top: pos.yPct + "%",
      transform: "translate(-50%, -50%)",
      zIndex: 1,
      textAlign: "center",
    };
  }

  useEffect(() => {
    if (!guide) return;
    const hide = () => setGuide(false);
    window.addEventListener("scroll", hide, { passive: true, once: true });
    const t = setTimeout(hide, 4000);
    return () => { window.removeEventListener("scroll", hide); clearTimeout(t); };
  }, [guide]);

  const label = guestName || guestLabel || "Dear Guest";
  const gateJustify = position === "top" ? "flex-start" : position === "bottom" ? "flex-end" : "space-between";

  // Decorative frame behind the guest name: full screen width, natural height
  // (height auto so the artwork is never stretched). Capped at the gate width.
  const guestFrame = guestFrameUrl ? (
    <img src={guestFrameUrl} alt="" aria-hidden style={{
      position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
      width: "100vw", maxWidth: 430, height: "auto",
      pointerEvents: "none", zIndex: 0,
    }} />
  ) : null;

  return (
    <>
      {/* Shell ref — inv-animate class added after gate opens to trigger section animations */}
      <div ref={shellRef}>
        {children}
      </div>

      {phase !== "open" && (
        <div
          className={`inv-gate inv-animate reveal-${revealStyle}${phase === "opening" ? " is-opening" : ""}`}
          style={{
            fontFamily: theme.font,
            color: theme.text,
            ...(hasCustomPos ? {} : { justifyContent: gateJustify }),
            ...(bgUrl ? {} : { background: theme.coverGradient }),
          }}
        >
          {/* Background image layer — split into two parting halves for the curtain reveal */}
          {revealStyle === "curtain" ? (
            <>
              <div className="inv-curtain inv-curtain-l" style={{
                position: "absolute", inset: 0, clipPath: "inset(0 50% 0 0)",
                ...(bgUrl
                  ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: theme.coverGradient }),
              }} />
              <div className="inv-curtain inv-curtain-r" style={{
                position: "absolute", inset: 0, clipPath: "inset(0 0 0 50%)",
                ...(bgUrl
                  ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: theme.coverGradient }),
              }} />
            </>
          ) : (
            bgUrl && (
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center",
                ...(blur > 0 ? { filter: `blur(${blur}px)`, transform: "scale(1.06)" } : {}),
              }} />
            )
          )}
          {gateOverlay?.enabled && (
            <div style={{ position: "absolute", inset: 0, background: gateOverlay.color, opacity: gateOverlay.opacity }} />
          )}

          {hasCustomPos ? (
            /* ── Absolute-position layout (custom drag positions) ── */
            <>
              {/* Monogram */}
              {showMonogram && coverUrl && (
                <div style={ep("monogram")}>
                  <img src={coverUrl} alt="Monogram"
                    style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 28px rgba(0,0,0,0.5)" }} />
                </div>
              )}

              {/* Pretitle */}
              <div style={ep("pretitle")}>
                <p className="inv-pretitle" style={{ color: theme.accent, margin: 0 }}>You are invited to</p>
              </div>

              {/* Title + ornament */}
              <div style={ep("title")}>
                <div className="inv-script" style={{ color: theme.primary }}>{eventTitle}</div>
                <div className="inv-ornament-line" style={{ color: theme.accent }}>
                  <div className="line" />
                  {theme.gem && <span className="gem">{theme.gem}</span>}
                  <div className="line" />
                </div>
              </div>

              {/* Subtitle */}
              <div style={ep("subtitle")}>
                {/* subtitle placeholder — themed cover subheading */}
              </div>

              {/* Guest name */}
              {showGuestName && (
                <div style={ep("guestName")}>
                  <div className="inv-gate-guest" style={{ position: "relative" }}>
                    {guestFrame}
                    <span className="inv-greeting-label" style={{ color: theme.accent, borderColor: theme.accent, position: "relative", zIndex: 1 }}>♥ Dear</span>
                    <div className="inv-gate-name" style={{ color: theme.primary, fontFamily: theme.headingFont, position: "relative", zIndex: 1 }}>{label}</div>
                  </div>
                </div>
              )}

              {/* Open Letter button */}
              <div style={ep("openBtn")}>
                <button className="inv-gate-open" onClick={open} aria-label="Open invitation">
                  <HandPointer className="inv-gate-hand" color={theme.accent} />
                  <span className="inv-gate-open-label" style={{ color: theme.accent, borderColor: theme.accent }}>Open Letter</span>
                </button>
              </div>
            </>
          ) : (
            /* ── Default flex layout ── */
            <>
              {/* TOP ZONE: monogram + pretitle */}
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                {showMonogram && coverUrl && (
                  <img src={coverUrl} alt="Monogram"
                    style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 28px rgba(0,0,0,0.5)" }} />
                )}
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
                {showGuestName && (
                  <div className="inv-gate-guest" style={{ position: "relative" }}>
                    {guestFrame}
                    <span className="inv-greeting-label" style={{ color: theme.accent, borderColor: theme.accent, position: "relative", zIndex: 1 }}>♥ Dear</span>
                    <div className="inv-gate-name" style={{ color: theme.primary, fontFamily: theme.headingFont, position: "relative", zIndex: 1 }}>{label}</div>
                  </div>
                )}
                <button className="inv-gate-open" onClick={open} aria-label="Open invitation">
                  <HandPointer className="inv-gate-hand" color={theme.accent} />
                  <span className="inv-gate-open-label" style={{ color: theme.accent, borderColor: theme.accent }}>Open Letter</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {guide && (
        <div className="inv-guide" onClick={() => setGuide(false)} role="button" aria-label="Dismiss guide">
          <HandPointer className="inv-guide-hand" color={theme.accent} />
          <p className="inv-guide-text">Scroll to explore</p>
        </div>
      )}
    </>
  );
}
