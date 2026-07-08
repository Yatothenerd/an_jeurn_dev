"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeTokens } from "@/lib/themes/types";
import { HandPointer } from "./HandPointer";

type ElemKey = "monogram" | "pretitle" | "title" | "subtitle" | "guestName" | "openBtn";
export type ElementPositions = Partial<Record<ElemKey, { xPct: number; yPct: number; scale?: number }>>;

export const GATE_DEFAULT_POSITIONS: Record<ElemKey, { xPct: number; yPct: number; scale?: number }> = {
  monogram:  { xPct: 50, yPct: 11 },
  pretitle:  { xPct: 50, yPct: 22 },
  title:     { xPct: 50, yPct: 36 },
  subtitle:  { xPct: 50, yPct: 49 },
  guestName: { xPct: 50, yPct: 70 },
  openBtn:   { xPct: 50, yPct: 85 },
};

interface Props {
  eventTitle: string;
  /** Greeting line shown above the names (the "You are invited to" slot). */
  pretitle?: string;
  /** Cover subheading / intro lines — shown in the gate's subtitle slot when the admin has arranged elements freely. */
  subheading?: string;
  guestName: string | null;
  guestLabel?: string;
  theme: ThemeTokens;
  bgUrl?: string | null;
  coverUrl?: string | null;
  gateOverlay?: { enabled: boolean; color: string; opacity: number };
  revealStyle?: "fade" | "envelope" | "curtain" | "slideUp";
  /** Play the entrance animation when opening the cover (default true). */
  animateOpen?: boolean;
  /** Color for the "Open" button label/border. Falls back to theme accent. */
  openButtonColor?: string | null;
  scrollGuide?: boolean;
  /** Custom caption for the one-time guidance overlay. */
  guideText?: string;
  /** Hand icon for the open button + guidance overlay (default = drawn hand). */
  hand?: { kind: "default" | "emoji" | "image"; value: string };
  scrollToContent?: boolean;
  position?: "top" | "center" | "bottom";
  blur?: number;
  showGuestName?: boolean;
  guestFrameUrl?: string | null;
  showMonogram?: boolean;
  elementPositions?: ElementPositions;
  children: React.ReactNode;
}

export function InviteGate({
  eventTitle, pretitle, subheading, guestName, guestLabel, theme, bgUrl, coverUrl, gateOverlay,
  animateOpen = true, openButtonColor,
  scrollGuide = true, guideText, hand,
  scrollToContent = true,
  position = "center", blur = 0,
  showGuestName = true, guestFrameUrl, showMonogram = true,
  elementPositions,
  children,
}: Props) {
  const openColor = openButtonColor || theme.accent;
  // `scrollToContent` mirrors keepCoverAfterOpen. When OFF, the cover exists only
  // to open the invite — once opened we collapse it so guests land on content.
  const keepCover = scrollToContent;
  // The gate is the invitation's COVER PAGE — a real page at the top of the
  // scroll flow (one screen tall), not an overlay. "closed" only means the
  // page is scroll-locked to it; opening unlocks and glides to the content.
  const [phase, setPhase] = useState<"closed" | "open">("closed");
  const [guide, setGuide] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);

  // Admin preview: skip the gate instantly so the live preview can focus a section.
  useEffect(() => {
    const skip = () => {
      setPhase("open");
      if (animateOpen) shellRef.current?.classList.add("inv-animate");
    };
    window.addEventListener("anjeurn:gate-skip", skip);
    return () => window.removeEventListener("anjeurn:gate-skip", skip);
  }, [animateOpen]);

  // Configurable hand icon (drawn hand / emoji / uploaded image).
  const HandIcon = ({ className }: { className: string }) => {
    if (hand?.kind === "emoji" && hand.value) {
      return <span className={className} role="img" aria-hidden>{hand.value}</span>;
    }
    if (hand?.kind === "image" && hand.value) {
      return <img src={hand.value} alt="" className={className} />;
    }
    return <HandPointer className={className} color={theme.accent} />;
  };

  // While closed, pin the viewport to the cover page (no peeking at content).
  useEffect(() => {
    if (phase === "open") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => { document.body.style.overflow = prev; };
  }, [phase]);

  function open() {
    if (phase === "closed") {
      setPhase("open");
      if (animateOpen) shellRef.current?.classList.add("inv-animate");
      if (scrollGuide && !sessionStorage.getItem("inv-guide-seen")) {
        setGuide(true);
        sessionStorage.setItem("inv-guide-seen", "1");
      }
    }
    // Glide from the cover page down to the first content page (also works as
    // a "scroll down" button when the guest returns to the cover later).
    // When the cover isn't kept, it collapses (below) so content is already at
    // the top — just glide to 0.
    setTimeout(() => {
      if (!keepCover) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const gate = gateRef.current;
      const top = gate ? gate.offsetTop + gate.offsetHeight : window.innerHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }, 120);
  }

  const hasCustomPos = !!elementPositions && Object.keys(elementPositions).length > 0;

  function ep(key: ElemKey): React.CSSProperties {
    const pos = elementPositions?.[key] ?? GATE_DEFAULT_POSITIONS[key];
    const scale = pos.scale && pos.scale > 0 ? pos.scale : 1;
    return {
      position: "absolute",
      left: pos.xPct + "%",
      top: pos.yPct + "%",
      transform: `translate(-50%, -50%) scale(${scale})`,
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
      {/* ── Cover page — a real in-flow page, exactly one screen tall ── */}
      <div
        ref={gateRef}
        className={`inv-gate${animateOpen ? " inv-animate" : ""}`}
        style={{
          fontFamily: theme.font,
          color: theme.text,
          ...(hasCustomPos ? {} : { justifyContent: gateJustify }),
          ...(bgUrl ? {} : { background: theme.coverGradient }),
          // Cover not kept: remove it from the flow once opened.
          ...(phase === "open" && !keepCover ? { display: "none" } : {}),
        }}
      >
          {/* Background layer — motion video, or image/GIF with optional blur */}
          {bgUrl && (
            /\.(mp4|webm|mov)(\?|$)/i.test(bgUrl) ? (
              <video
                src={bgUrl}
                autoPlay
                muted
                loop
                playsInline
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover",
                  ...(blur > 0 ? { filter: `blur(${blur}px)`, transform: "scale(1.06)" } : {}),
                }}
              />
            ) : (
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
                <p className="inv-pretitle" style={{ color: theme.accent, margin: 0 }}>{pretitle || "You are invited to"}</p>
              </div>

              {/* Title + ornament */}
              <div style={ep("title")}>
                <div className="inv-script" style={{ color: theme.title || theme.primary }}>{eventTitle}</div>
                <div className="inv-ornament-line" style={{ color: theme.accent }}>
                  <div className="line" />
                  {theme.gem && <span className="gem">{theme.gem}</span>}
                  <div className="line" />
                </div>
              </div>

              {/* Subtitle — the cover's intro lines / subheading */}
              {subheading && (
                <div style={ep("subtitle")}>
                  <p className="inv-pretitle" style={{ color: theme.muted, margin: 0, fontStyle: "italic", letterSpacing: "0.04em" }}>
                    {subheading}
                  </p>
                </div>
              )}

              {/* Guest name */}
              {showGuestName && (
                <div style={ep("guestName")}>
                  <div className="inv-gate-guest" style={{ position: "relative" }}>
                    {guestFrame}
                    <span className="inv-greeting-label" style={{ color: theme.accent, borderColor: theme.accent, position: "relative", zIndex: 1 }}>♥ Dear</span>
                    <div className="inv-gate-name" style={{ color: theme.title || theme.primary, fontFamily: theme.headingFont, position: "relative", zIndex: 1 }}>{label}</div>
                  </div>
                </div>
              )}

              {/* Open Letter button */}
              <div style={ep("openBtn")}>
                <button className="inv-gate-open" onClick={open} aria-label="Open invitation">
                  <HandIcon className="inv-gate-hand" />
                  <span className="inv-gate-open-label" style={{ color: openColor, borderColor: openColor }}>Open Letter</span>
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
                <p className="inv-pretitle" style={{ color: theme.accent, margin: 0 }}>{pretitle || "You are invited to"}</p>
              </div>

              {/* MIDDLE ZONE: event title + ornament */}
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <div className="inv-script" style={{ color: theme.title || theme.primary }}>{eventTitle}</div>
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
                    <div className="inv-gate-name" style={{ color: theme.title || theme.primary, fontFamily: theme.headingFont, position: "relative", zIndex: 1 }}>{label}</div>
                  </div>
                )}
                <button className="inv-gate-open" onClick={open} aria-label="Open invitation">
                  <HandIcon className="inv-gate-hand" />
                  <span className="inv-gate-open-label" style={{ color: openColor, borderColor: openColor }}>Open Letter</span>
                </button>
              </div>
            </>
          )}
      </div>

      {/* Shell ref — inv-animate class added after gate opens to trigger section animations */}
      <div ref={shellRef}>
        {children}
      </div>

      {guide && (
        <div className="inv-guide" onClick={() => setGuide(false)} role="button" aria-label="Dismiss guide">
          <HandIcon className="inv-guide-hand" />
          <p className="inv-guide-text">{guideText || "Scroll to explore"}</p>
        </div>
      )}
    </>
  );
}
