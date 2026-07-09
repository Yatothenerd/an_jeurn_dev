"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ThemeTokens } from "@/lib/themes/types";
import { HandPointer } from "./HandPointer";

/** How a single-line text element handles content that's too long for its box:
 *  wrap onto a new line, or shrink its own font-size until it fits on one line. */
export type TextFit = "wrap" | "shrink";

/** "Shrink to fit" — measures its own rendered width against the available
 *  space and steps its font-size down (in place, via direct DOM writes to
 *  avoid a render per frame) until the text fits on one line, or it hits the
 *  floor. Used for content whose length varies at runtime (e.g. a guest's
 *  real name) where a fixed font-size can't be picked in advance. */
function AutoFitText({ children, style, minRatio = 0.55 }: {
  children: React.ReactNode; style?: React.CSSProperties; minRatio?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const baseSize = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    baseSize.current = parseFloat(getComputedStyle(el).fontSize);
    const base = baseSize.current;
    let size = base;
    el.style.fontSize = `${size}px`;
    let frame = 0;
    const step = () => {
      if (!el) return;
      if (el.scrollWidth > el.clientWidth + 1 && size > base * minRatio) {
        size = Math.max(base * minRatio, size - base * 0.05);
        el.style.fontSize = `${size}px`;
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <span ref={ref} style={{ ...style, display: "inline-block", maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", verticalAlign: "bottom" }}>
      {children}
    </span>
  );
}

type ElemKey = "monogram" | "pretitle" | "title" | "subtitle" | "guestName" | "openBtn";
export type ElementPositions = Partial<Record<ElemKey, {
  xPct: number; yPct: number; scale?: number; color?: string; font?: string;
  /** Font weight (400–800). */
  weight?: number;
  /** Text alignment within the element's box. */
  align?: "left" | "center" | "right";
}>>;

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
  /** Long-text behavior for the greeting line: wrap onto a new line, or shrink to fit one line (default "wrap"). */
  pretitleFit?: TextFit;
  /** Long-text behavior for the names/title: wrap onto a new line, or shrink to fit one line (default "wrap"). */
  titleFit?: TextFit;
  /** Cover subheading / intro lines — shown in the gate's subtitle slot when the admin has arranged elements freely. */
  subheading?: string;
  /** Long-text behavior for the intro lines: wrap onto a new line, or shrink to fit one line (default "wrap"). */
  subheadingFit?: TextFit;
  guestName: string | null;
  guestLabel?: string;
  /** Prefix badge shown above the guest name (default "Dear"). */
  guestPrefix?: string | null;
  /** Text color for the prefix badge. Falls back to theme accent. */
  guestPrefixColor?: string | null;
  /** Font-family stack for the prefix badge. */
  guestPrefixFont?: string | null;
  /** Font size (px) for the prefix badge. */
  guestPrefixSize?: number | null;
  /** Font weight (400–800) for the prefix badge. */
  guestPrefixWeight?: number | null;
  /** Long-text behavior for the prefix badge: wrap onto a new line, or shrink to fit one line (default "wrap"). */
  guestPrefixFit?: TextFit;
  /** Long-text behavior for the guest's name: wrap onto a new line, or shrink to fit one line (default "wrap").
   *  Most useful in "shrink" mode since a real guest's name length is unknown in advance. */
  guestNameFit?: TextFit;
  theme: ThemeTokens;
  bgUrl?: string | null;
  coverUrl?: string | null;
  gateOverlay?: { enabled: boolean; color: string; opacity: number };
  revealStyle?: "fade" | "envelope" | "curtain" | "slideUp";
  /** Play the entrance animation when opening the cover (default true). */
  animateOpen?: boolean;
  /** Color for the "Open" button label. Falls back to theme accent. */
  openButtonColor?: string | null;
  /** Border (stroke) color for the "Open" button. Falls back to the label color. */
  openButtonStroke?: string | null;
  /** Fill (background) color for the "Open" button. Transparent when unset. */
  openButtonFill?: string | null;
  /** Custom label for the "Open" button (default "Open Letter"). */
  openButtonText?: string | null;
  /** Long-text behavior for the "Open" button label: wrap onto a new line, or shrink to fit one line (default "wrap"). */
  openButtonFit?: TextFit;
  /** Font-family stack for the "Open" button label. */
  openButtonFont?: string | null;
  /** Font size (px) for the "Open" button label. */
  openButtonSize?: number | null;
  /** Font weight (400–800) for the "Open" button label. */
  openButtonWeight?: number | null;
  /** Show the button's border (default true). */
  openButtonStrokeEnabled?: boolean;
  /** Show the button's fill color (default false — transparent). */
  openButtonFillEnabled?: boolean;
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
  eventTitle, pretitle, pretitleFit = "wrap", titleFit = "wrap", subheading, subheadingFit = "wrap",
  guestName, guestLabel, guestPrefix,
  guestPrefixColor, guestPrefixFont, guestPrefixSize, guestPrefixWeight, guestPrefixFit = "wrap",
  guestNameFit = "wrap",
  theme, bgUrl, coverUrl, gateOverlay,
  animateOpen = true, openButtonColor, openButtonStroke, openButtonFill, openButtonText, openButtonFit = "wrap",
  openButtonFont, openButtonSize, openButtonWeight, openButtonStrokeEnabled = true, openButtonFillEnabled = false,
  scrollGuide = true, guideText, hand,
  scrollToContent = true,
  position = "center", blur = 0,
  showGuestName = true, guestFrameUrl, showMonogram = true,
  elementPositions,
  children,
}: Props) {
  // Per-element style overrides (color/font) set on the gate WYSIWYG editor.
  const ov = (k: ElemKey) => elementPositions?.[k];
  const ovStyle = (k: ElemKey, fallbackColor?: string, fallbackFont?: string): React.CSSProperties => ({
    color: ov(k)?.color || fallbackColor,
    ...((ov(k)?.font || fallbackFont) ? { fontFamily: ov(k)?.font || fallbackFont } : {}),
    ...(ov(k)?.weight ? { fontWeight: ov(k)?.weight } : {}),
    ...(ov(k)?.align ? { textAlign: ov(k)?.align } : {}),
  });

  const openColor = ov("openBtn")?.color || openButtonColor || theme.accent;
  const openStroke = openButtonStroke || openColor;
  const openBtnStyle: React.CSSProperties = {
    color: openColor,
    ...(openButtonStrokeEnabled
      ? { borderColor: openStroke, borderWidth: 1, borderStyle: "solid" }
      : { borderStyle: "none", borderWidth: 0 }),
    background: openButtonFillEnabled && openButtonFill ? openButtonFill : "transparent",
    ...((openButtonFont || ov("openBtn")?.font) ? { fontFamily: openButtonFont || ov("openBtn")?.font } : {}),
    ...(openButtonSize ? { fontSize: openButtonSize } : {}),
    ...(openButtonWeight ? { fontWeight: openButtonWeight } : {}),
  };
  const guestPrefixStyle: React.CSSProperties = {
    color: guestPrefixColor || theme.accent,
    borderColor: guestPrefixColor || theme.accent,
    ...(guestPrefixFont ? { fontFamily: guestPrefixFont } : {}),
    ...(guestPrefixSize ? { fontSize: guestPrefixSize } : {}),
    ...(guestPrefixWeight ? { fontWeight: guestPrefixWeight } : {}),
    ...(guestPrefixFit === "wrap" ? { whiteSpace: "normal" } : {}),
    position: "relative", zIndex: 1,
  };
  const guestPrefixNode = <>♥ {guestPrefixFit === "shrink" ? <AutoFitText>{guestPrefix || "Dear"}</AutoFitText> : (guestPrefix || "Dear")}</>;
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
  const guestNameNode = guestNameFit === "shrink" ? <AutoFitText>{label}</AutoFitText> : label;
  const pretitleText = pretitle || "You are invited to";
  const pretitleNode = pretitleFit === "shrink" ? <AutoFitText>{pretitleText}</AutoFitText> : pretitleText;
  const titleNode = titleFit === "shrink" ? <AutoFitText>{eventTitle}</AutoFitText> : eventTitle;
  const subheadingNode = subheadingFit === "shrink" ? <AutoFitText>{subheading}</AutoFitText> : subheading;
  const openButtonLabel = openButtonText || "Open Letter";
  const openButtonNode = openButtonFit === "shrink" ? <AutoFitText>{openButtonLabel}</AutoFitText> : openButtonLabel;
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
                <p className="inv-pretitle" style={{ ...ovStyle("pretitle", theme.accent), margin: 0 }}>{pretitleNode}</p>
              </div>

              {/* Title + ornament */}
              <div style={ep("title")}>
                <div className="inv-script" style={ovStyle("title", theme.title || theme.primary)}>{titleNode}</div>
                <div className="inv-ornament-line" style={{ color: theme.accent }}>
                  <div className="line" />
                  {theme.gem && <span className="gem">{theme.gem}</span>}
                  <div className="line" />
                </div>
              </div>

              {/* Subtitle — the cover's intro lines / subheading */}
              {subheading && (
                <div style={ep("subtitle")}>
                  <p className="inv-pretitle" style={{ ...ovStyle("subtitle", theme.muted), margin: 0, fontStyle: "italic", letterSpacing: "0.04em" }}>
                    {subheadingNode}
                  </p>
                </div>
              )}

              {/* Guest name */}
              {showGuestName && (
                <div style={ep("guestName")}>
                  <div className="inv-gate-guest" style={{ position: "relative" }}>
                    {guestFrame}
                    <span className="inv-greeting-label" style={guestPrefixStyle}>{guestPrefixNode}</span>
                    <div className="inv-gate-name" style={{ ...ovStyle("guestName", theme.title || theme.primary, theme.headingFont), position: "relative", zIndex: 1 }}>{guestNameNode}</div>
                  </div>
                </div>
              )}

              {/* Open Letter button */}
              <div style={ep("openBtn")}>
                <button className="inv-gate-open" onClick={open} aria-label="Open invitation">
                  <span className="inv-gate-open-label" style={openBtnStyle}>{openButtonNode}</span>
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
                <p className="inv-pretitle" style={{ ...ovStyle("pretitle", theme.accent), margin: 0 }}>{pretitleNode}</p>
              </div>

              {/* MIDDLE ZONE: event title + ornament */}
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <div className="inv-script" style={ovStyle("title", theme.title || theme.primary)}>{titleNode}</div>
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
                    <span className="inv-greeting-label" style={guestPrefixStyle}>{guestPrefixNode}</span>
                    <div className="inv-gate-name" style={{ ...ovStyle("guestName", theme.title || theme.primary, theme.headingFont), position: "relative", zIndex: 1 }}>{guestNameNode}</div>
                  </div>
                )}
                <button className="inv-gate-open" onClick={open} aria-label="Open invitation">
                  <span className="inv-gate-open-label" style={openBtnStyle}>{openButtonNode}</span>
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
