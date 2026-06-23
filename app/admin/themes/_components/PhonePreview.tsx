"use client";

import { useState, useEffect, useRef } from "react";
import { buildFontsHref } from "@/lib/themes/shared/standard-css";
import {
  DbCoverSection,
  DbCountdownSection,
  DbDetailsSection,
  DbVideoSection,
  DbKhqrSection,
} from "@/app/invite/[slug]/_components/DbThemeSections";
import type { ThemeTokens } from "@/lib/themes/types";

// ── Constants ──────────────────────────────────────────────────────────────────

const SCREEN_W = 252;
const SCREEN_H = 492;
const CONTENT_W = 430;
const SCALE = SCREEN_W / CONTENT_W; // ≈ 0.586
const GATE_H = Math.ceil(SCREEN_H / SCALE); // 840

// Real app button size/position scaled to preview screen coords
const BTN_SIZE  = Math.round(46 * SCALE); // ≈ 27px
const BTN_RIGHT = Math.round(20 * SCALE); // ≈ 12px  (1.25rem * SCALE)
const BTN_BOT   = Math.round(112 * SCALE); // ≈ 66px (7rem * SCALE)
const BTN_GAP   = Math.round(10 * SCALE);  // ≈ 6px

const DEFAULT_TOKENS: ThemeTokens = {
  font:          "'Georgia','Times New Roman',serif",
  bg:            "transparent",
  altBg:         "rgba(0,0,0,0.10)",
  cardBg:        "rgba(255,255,255,0.10)",
  coverGradient: "linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0.08))",
  text:          "#ffffff",
  primary:       "#ffffff",
  muted:         "rgba(255,255,255,0.55)",
  accent:        "#c9a96e",
  border:        "rgba(201,169,110,0.44)",
  btnBg:         "#c9a96e",
  btnText:       "#fff",
  musicBg:       "rgba(0,0,0,0.50)",
  musicColor:    "#c9a96e",
  title:         "#ffffff",
  subtitle:      "rgba(255,255,255,0.88)",
  header:        "#c9a96e",
  body:          "rgba(255,255,255,0.85)",
};

// ── Types ──────────────────────────────────────────────────────────────────────

type ElemKey = "monogram" | "pretitle" | "title" | "subtitle" | "guestName" | "openBtn";
export type ElementPositions = Partial<Record<ElemKey, { xPct: number; yPct: number }>>;

const DEF_POS: Record<ElemKey, { xPct: number; yPct: number }> = {
  monogram:  { xPct: 50, yPct: 11 },
  pretitle:  { xPct: 50, yPct: 22 },
  title:     { xPct: 50, yPct: 36 },
  subtitle:  { xPct: 50, yPct: 49 },
  guestName: { xPct: 50, yPct: 70 },
  openBtn:   { xPct: 50, yPct: 85 },
};

export interface PreviewColorScheme {
  text: string; accent: string;
  title: string; subtitle: string; header: string; body: string; muted: string;
}

export interface EventFonts {
  heading: string;
  body: string;
  headingScale?: number;
  bodyScale?: number;
}

export interface PreviewOverlay {
  style:   "floating" | "bottomBar";
  map:     { enabled: boolean };
  music:   { enabled: boolean };
  goToTop: { enabled: boolean };
  gifts:   { enabled: boolean };
  actionButton?: { bg: string; color: string };
}

export interface PreviewSection {
  type: string;
  included: boolean;
  content: Record<string, unknown>;
}

export interface PhonePreviewProps {
  contentType:         "photo" | "text";
  sections:            PreviewSection[];
  colorScheme:         PreviewColorScheme;
  /** Landing-page (gate) palette; falls back to colorScheme. */
  gateColorScheme?:    PreviewColorScheme;
  /** Event fonts: heading (display) + body, with optional size scales. */
  fonts?:              EventFonts;
  /** Background image blur in px (landing page / gate). */
  backgroundBlur?:     number;
  /** Background blur for content sections. */
  sectionBlur?:        number;
  /** Extra color overlay for content sections. */
  sectionOverlay?:     { enabled: boolean; color: string; opacity: number };
  /** Color overlay for the landing page (gate). */
  gateOverlay?:        { enabled: boolean; color: string; opacity: number };
  /** Opening animation style (shown as a label; full animation plays on the live invite). */
  revealStyle?:        "fade" | "envelope" | "curtain" | "slideUp";
  /** Keep the cover as the first section after opening. */
  keepCoverAfterOpen?: boolean;
  /** Landing-page (gate) content vertical placement. */
  gatePosition?:       "top" | "center" | "bottom";
  overlay:             PreviewOverlay;
  bgImageFile:         File | null;
  bgVideoFile:         File | null;
  bgAssetType:         "image" | "video";
  coverFile:           File | null;
  existingBgUrl?:      string | null;
  existingBgVideoUrl?: string | null;
  existingCoverUrl?:   string | null;
  eventTitle?:         string;
  eventDate?:          string | null;
  venueName?:          string | null;
  venueMapUrl?:        string | null;
  /** Whether to show the guest name area on the gate. */
  showGuestName?:      boolean;
  /** Whether to show the monogram circle on the gate. */
  showMonogram?:       boolean;
  /** Show the monogram circle at the top of the cover section. */
  showMonogramInSections?: boolean;
  /** Decorative frame image URL for guest name area. */
  guestFrameUrl?:      string | null;
  /** Custom drag positions for gate elements. */
  elementPositions?:   ElementPositions;
  /** Called whenever the admin drags an element to a new position. */
  onPositionsChange?:  (pos: ElementPositions) => void;
  /** Called when the admin reorders sections in the sections preview. */
  onSectionsReorder?:  (newOrder: PreviewSection[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => { URL.revokeObjectURL(u); };
  }, [file]);
  return url;
}

function buildTokens(c: PreviewColorScheme, isPhotoMode: boolean, fonts?: EventFonts): ThemeTokens {
  return {
    ...DEFAULT_TOKENS,
    font:          fonts?.body    || DEFAULT_TOKENS.font,
    headingFont:   fonts?.heading || DEFAULT_TOKENS.font,
    headingScale:  fonts?.headingScale ?? 1,
    bodyScale:     fonts?.bodyScale ?? 1,
    text:          c.text,
    primary:       c.text,
    accent:        c.accent,
    border:        c.accent + "44",
    btnBg:         c.accent,
    btnText:       "#fff",
    musicColor:    c.accent,
    muted:         c.muted,
    title:         c.title    || c.text,
    subtitle:      c.subtitle || c.text,
    header:        c.header   || c.accent,
    body:          c.body     || c.text,
    coverGradient: isPhotoMode
      ? "transparent"
      : "linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0.08))",
  };
}

// ── Section renderer (preview-safe) ───────────────────────────────────────────

interface SecProps {
  sec:          PreviewSection;
  tokens:       ThemeTokens;
  coverUrl:     string | null;
  eventTitle:   string;
  eventDate:    string;
  venueName:    string | null;
  venueMapUrl:  string | null;
}

function PreviewSectionNode({ sec, tokens, coverUrl, eventTitle, eventDate, venueName, venueMapUrl }: SecProps) {
  const c = sec.content;
  const assets = coverUrl ? { cover: coverUrl } : undefined;

  switch (sec.type) {
    case "cover":
      return (
        // DbCoverSection uses minHeight:100vh; inside zoom that equals browser viewport, not phone screen.
        // Constrain it to GATE_H (840px pre-zoom = 492px on screen) so it fills the phone exactly.
        <div style={{ minHeight: GATE_H, display: "flex", flexDirection: "column" }}>
          <DbCoverSection
            content={c as { heading?: string; subheading?: string; guestLabel?: string }}
            eventTitle={eventTitle}
            eventDate={eventDate}
            venueName={venueName}
            guestName={null}
            theme={tokens}
            assets={assets}
          />
        </div>
      );

    case "countdown":
      return (
        <DbCountdownSection
          targetDate={(c.targetDate as string) || eventDate}
          label={c.label as string | undefined}
          eventDate={eventDate}
          theme={tokens}
          hideTitle={c.hideTitle as boolean | undefined}
        />
      );

    case "details":
      return (
        <DbDetailsSection
          content={c as { title?: string; items?: { icon?: string; label: string; value: string }[]; photoItems?: { imageUrl: string; caption: string }[] }}
          venueName={venueName}
          venueMapUrl={venueMapUrl}
          theme={tokens}
        />
      );

    case "gallery":
      return <GalleryPlaceholder tokens={tokens} />;

    case "video":
      return (
        <DbVideoSection
          content={c as { url?: string; caption?: string; title?: string; thumbnailUrl?: string }}
          theme={tokens}
        />
      );

    case "wishing":
      return (
        <WishingPlaceholder tokens={tokens} placeholder={c.placeholder as string | undefined} />
      );

    case "khqr":
      return (
        <DbKhqrSection
          content={c as { title?: string; recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string }}
          theme={tokens}
        />
      );

    default:
      return null;
  }
}

function GalleryPlaceholder({ tokens }: { tokens: ThemeTokens }) {
  return (
    <section style={{ padding: "3.25rem 1.75rem", borderTop: `1px solid ${tokens.border}`, fontFamily: tokens.font }}>
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>🖼</div>
          <p style={{ margin: 0, fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: tokens.header }}>Gallery</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ paddingTop: "100%", background: "rgba(255,255,255,0.08)", borderRadius: 6, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", opacity: 0.25 }}>🖼</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: "0.875rem", margin: "0.875rem 0 0", fontSize: "0.8125rem", color: tokens.muted, fontStyle: "italic" }}>
          Upload photos to the event to see the gallery
        </p>
      </div>
    </section>
  );
}

function WishingPlaceholder({ tokens, placeholder }: { tokens: ThemeTokens; placeholder?: string }) {
  const cardBg = "rgba(255,255,255,0.06)";
  const border  = `1px solid ${tokens.border}`;
  return (
    <section style={{ padding: "3.25rem 1.75rem", borderTop: `1px solid ${tokens.border}`, fontFamily: tokens.font }}>
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>✨</div>
          <p style={{ margin: 0, fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: tokens.header }}>Wishes</p>
        </div>
        <div style={{ background: cardBg, borderRadius: 10, border, padding: "0.875rem 1rem", fontStyle: "italic", fontSize: "0.9375rem", color: tokens.body, marginBottom: "1rem" }}>
          &ldquo;A heartfelt wish…&rdquo;
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ height: 38, background: cardBg, borderRadius: 8, border }} />
          <div style={{ height: 72, background: cardBg, borderRadius: 8, border, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "0.875rem", color: tokens.muted, fontStyle: "italic" }}>{placeholder || "Leave a wish…"}</span>
          </div>
          <div style={{ padding: "0.875rem", borderRadius: 8, background: tokens.btnBg, textAlign: "center", fontSize: "0.9375rem", color: tokens.btnText, fontWeight: 600 }}>
            Send Wish ✨
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Overlay buttons preview (mirrors InviteActions, positioned at screen level) ─

function OverlayPreviewButtons({ overlay }: { overlay: PreviewOverlay }) {
  const showGifts = overlay.gifts.enabled;
  const showMap   = overlay.map.enabled;
  const showMusic = overlay.music.enabled;

  const btn: React.CSSProperties = {
    width:           BTN_SIZE,
    height:          BTN_SIZE,
    borderRadius:    "50%",
    background:      overlay.actionButton?.bg ?? "rgba(0,0,0,0.5)",
    color:           overlay.actionButton?.color ?? "#c9a96e",
    border:          "none",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    fontSize:        `${BTN_SIZE * 0.48}px`,
    boxShadow:       "0 1px 6px rgba(0,0,0,0.3)",
    flexShrink:      0,
    pointerEvents:   "none" as const,
    userSelect:      "none" as const,
  };

  return (
    <div style={{
      position:       "absolute",
      bottom:         BTN_BOT,
      right:          BTN_RIGHT,
      zIndex:         10,
      display:        "flex",
      flexDirection:  "column",
      gap:            BTN_GAP,
      pointerEvents:  "none",
    }}>
      {/* RSVP — always part of the group */}
      <div style={btn}>✉</div>
      {showGifts && <div style={btn}>🎁</div>}
      {showMap   && <div style={btn}>📍</div>}
      {showMusic && <div style={btn}>🔊</div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PhonePreview({
  contentType,
  sections,
  colorScheme,
  gateColorScheme,
  fonts,
  backgroundBlur = 0,
  sectionBlur = 0,
  sectionOverlay,
  gateOverlay,
  revealStyle = "fade",
  keepCoverAfterOpen = true,
  gatePosition = "center",
  overlay,
  bgImageFile,
  bgVideoFile,
  bgAssetType,
  coverFile,
  existingBgUrl,
  existingBgVideoUrl,
  existingCoverUrl,
  eventTitle,
  eventDate,
  venueName,
  venueMapUrl,
  showGuestName = true,
  showMonogram = true,
  showMonogramInSections = false,
  guestFrameUrl,
  elementPositions,
  onPositionsChange,
  onSectionsReorder,
}: PhonePreviewProps) {
  // Load the event Google fonts once so the preview matches the live invite.
  useEffect(() => {
    const href = buildFontsHref();
    if (document.querySelector(`link[data-anjeurn-fonts]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-anjeurn-fonts", "1");
    document.head.appendChild(link);
  }, []);

  const bgImageObjUrl = useObjectUrl(bgAssetType === "image" ? bgImageFile : null);
  const bgVideoObjUrl = useObjectUrl(bgAssetType === "video" ? bgVideoFile : null);
  const coverObjUrl   = useObjectUrl(coverFile);

  const bgUrl      = bgAssetType === "image" ? (bgImageObjUrl ?? existingBgUrl ?? null) : null;
  const bgVideoUrl = bgAssetType === "video" ? (bgVideoObjUrl ?? existingBgVideoUrl ?? null) : null;
  const coverUrl   = coverObjUrl ?? existingCoverUrl ?? null;

  const isPhotoMode = contentType === "photo";
  // Mirror the live invite: the cover section honors this section-scoped toggle.
  const tokens      = { ...buildTokens(colorScheme, isPhotoMode, fonts), showMonogramInSections };
  const gateTokens  = buildTokens(gateColorScheme ?? colorScheme, isPhotoMode, fonts);
  const [showGate, setShowGate] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  // "Play open" — replays the chosen reveal animation on the preview gate.
  const [playOpen, setPlayOpen] = useState(false);
  useEffect(() => {
    if (!playOpen) return;
    const t = setTimeout(() => setPlayOpen(false), 950);
    return () => clearTimeout(t);
  }, [playOpen]);

  // ── Drag positioning state ─────────────────────────────────────────────────
  const [posMode, setPosMode] = useState(false);
  const [localPos, setLocalPos] = useState<ElementPositions>(elementPositions ?? {});
  const posRef = useRef<ElementPositions>(elementPositions ?? {});
  const gateRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  // Alignment guide lines (in % of screen) highlighted while dragging.
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  useEffect(() => {
    const next = elementPositions ?? {};
    posRef.current = next;
    setLocalPos(next);
  }, [elementPositions]);

  function getPos(key: ElemKey): { xPct: number; yPct: number } {
    return localPos[key] ?? DEF_POS[key];
  }

  // Smart snapping: a light free-move grid plus "guides" that snap to the screen
  // grid lines (25/50/75%) and to other elements' centers for clean alignment.
  const GRID = 2.5;            // free-move step (%)
  const SNAP = 3.5;            // distance to lock onto a guide line (%)
  const GRID_LINES = [25, 50, 75];

  function nearestGuide(value: number, targets: number[]): number | null {
    let best: number | null = null;
    let bestDist = SNAP;
    for (const t of targets) {
      const d = Math.abs(value - t);
      if (d <= bestDist) { bestDist = d; best = t; }
    }
    return best;
  }

  function startDrag(e: React.PointerEvent, key: ElemKey) {
    e.preventDefault();
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch { /* ignore */ }

    // Other visible elements act as alignment targets so items line up cleanly.
    const others: ElemKey[] = (["monogram", "pretitle", "title", "subtitle", "guestName", "openBtn"] as ElemKey[])
      .filter((k) => k !== key)
      .filter((k) => (k === "monogram" ? showMonogram && !!gateImageUrl : k === "guestName" ? showGuestName : true));

    const onMove = (me: PointerEvent) => {
      // Measure against the NON-zoomed screen so coordinates stay exact under `zoom`.
      const rect = screenRef.current?.getBoundingClientRect();
      if (!rect) return;
      const rawX = Math.max(4, Math.min(96, ((me.clientX - rect.left) / rect.width) * 100));
      const rawY = Math.max(3, Math.min(97, ((me.clientY - rect.top) / rect.height) * 100));

      const xTargets = [...GRID_LINES, ...others.map((k) => (posRef.current[k] ?? DEF_POS[k]).xPct)];
      const yTargets = [...GRID_LINES, ...others.map((k) => (posRef.current[k] ?? DEF_POS[k]).yPct)];

      const gx = nearestGuide(rawX, xTargets);
      const gy = nearestGuide(rawY, yTargets);
      const xPct = gx ?? Math.round(rawX / GRID) * GRID;
      const yPct = gy ?? Math.round(rawY / GRID) * GRID;

      const next: ElementPositions = { ...posRef.current, [key]: { xPct, yPct } };
      posRef.current = next;
      setLocalPos(next);
      setGuides({ x: gx, y: gy });
      onPositionsChange?.(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setGuides({ x: null, y: null });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }
  // ── Section drag-to-reorder state ─────────────────────────────────────────
  const [secMoveMode, setSecMoveMode] = useState(false);
  const [localSections, setLocalSections] = useState<PreviewSection[]>(sections);
  const [secDragIdx, setSecDragIdx] = useState<number | null>(null);
  const secDragRef = useRef<number | null>(null);

  useEffect(() => { setLocalSections(sections); }, [sections]);

  function handleSecDragStart(idx: number) {
    secDragRef.current = idx;
    setSecDragIdx(idx);
  }

  function handleSecDragEnter(idx: number) {
    const from = secDragRef.current;
    if (from === null || from === idx) return;
    setLocalSections((prev) => {
      const active = prev.filter((s) => s.included);
      const excluded = prev.filter((s) => !s.included);
      const reordered = [...active];
      const [item] = reordered.splice(from, 1);
      reordered.splice(idx, 0, item);
      return [...reordered, ...excluded];
    });
    secDragRef.current = idx;
    setSecDragIdx(idx);
  }

  function handleSecDragEnd() {
    secDragRef.current = null;
    setSecDragIdx(null);
    // Read the latest order via the functional updater (the pointer-up closure
    // would otherwise capture a stale localSections).
    setLocalSections((prev) => {
      onSectionsReorder?.(prev.filter((s) => s.included));
      return prev;
    });
  }

  // Pointer-based reorder (works for mouse + touch, unlike HTML5 drag). The
  // section under the pointer is found via elementFromPoint + a data-sec-idx tag.
  function startSecDrag(e: React.PointerEvent, i: number) {
    e.preventDefault();
    handleSecDragStart(i);
    const onMove = (me: PointerEvent) => {
      const el = document.elementFromPoint(me.clientX, me.clientY) as HTMLElement | null;
      const target = el?.closest("[data-sec-idx]") as HTMLElement | null;
      if (!target) return;
      const idx = Number(target.dataset.secIdx);
      if (!Number.isNaN(idx)) handleSecDragEnter(idx);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      handleSecDragEnd();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }
  // ──────────────────────────────────────────────────────────────────────────

  const activeSections = localSections.filter((s) => s.included);
  const coverContent   = (activeSections.find((s) => s.type === "cover")?.content ?? {}) as { heading?: string; subheading?: string; logoUrl?: string };
  // Mirror the live page: when the cover is hidden after opening, drop it from the scroll.
  // While reordering, show all sections so drag indices line up with the reorder logic.
  const renderedSections = keepCoverAfterOpen ? activeSections : activeSections.filter((s) => s.type !== "cover");
  const displaySections = secMoveMode ? activeSections : renderedSections;
  const revealLabel = { fade: "Fade & zoom", envelope: "Envelope / ticket", curtain: "Curtain split", slideUp: "Slide up" }[revealStyle];

  const gateImageUrl = coverUrl || bgUrl;
  // Monogram = uploaded logo if present, else fall back to the cover/background image.
  const gateMonogramUrl = coverContent.logoUrl || gateImageUrl;
  const gateJustify = gatePosition === "top" ? "flex-start" : gatePosition === "bottom" ? "flex-end" : "center";

  const effectiveTitle = eventTitle || coverContent.heading || "Our Special Day";
  const effectiveDate  = eventDate  || new Date(Date.now() + 30 * 86400000).toISOString();

  return (
    <div style={pp.outer}>
      {/* Reveal-animation keyframes for the in-preview "Play open" demo */}
      <style>{`
        .pp-gate.pp-playing.pp-reveal-fade     { animation: pp-fade 0.7s ease forwards; }
        .pp-gate.pp-playing.pp-reveal-slideUp  { animation: pp-slideup 0.75s cubic-bezier(0.7,0,0.3,1) forwards; }
        .pp-gate.pp-playing.pp-reveal-envelope { transform-origin: top center; animation: pp-envelope 0.85s ease forwards; }
        .pp-gate.pp-playing.pp-reveal-curtain  { animation: pp-fade 0.75s ease forwards; }
        @keyframes pp-fade     { to { opacity: 0; transform: scale(1.06); } }
        @keyframes pp-slideup  { to { opacity: 0.35; transform: translateY(-100%); } }
        @keyframes pp-envelope { 35% { opacity: 1; } to { opacity: 0; transform: perspective(1400px) rotateX(-92deg) translateY(-14%); } }
        .pp-gate.pp-playing.pp-reveal-curtain .pp-curtain-l { animation: pp-curtain-l 0.75s cubic-bezier(0.7,0,0.3,1) forwards; }
        .pp-gate.pp-playing.pp-reveal-curtain .pp-curtain-r { animation: pp-curtain-r 0.75s cubic-bezier(0.7,0,0.3,1) forwards; }
        @keyframes pp-curtain-l { to { transform: translateX(-100%); } }
        @keyframes pp-curtain-r { to { transform: translateX(100%); } }
      `}</style>
      <div style={pp.labelRow}>
        <span style={pp.label}>{showGate ? `Gate Preview · Opens: ${revealLabel}` : "Live Preview"}</span>
        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowGuide((g) => !g)}
            title={showGuide ? "Hide layout guide" : "Show layout guide"}
            style={{
              fontSize: "0.6875rem", padding: "0.1875rem 0.5rem",
              border: `1px solid ${showGuide ? "var(--c-accent)" : "var(--c-border)"}`,
              borderRadius: 5, background: showGuide ? "var(--c-accent)" : "transparent",
              color: showGuide ? "#fff" : "var(--c-muted)", cursor: "pointer",
            }}
          >
            Guide
          </button>
          <span style={pp.scaleHint}>Mobile · 430px</span>
        </div>
      </div>

      {/* Phone frame */}
      <div style={pp.frame}>
        <div style={pp.statusBar}><div style={pp.notch} /></div>

        {/* Screen — overflow:hidden clips rounded corners; bg + scroll are separate children */}
        <div ref={screenRef} style={pp.screen}>

          {/* Background layer — position:absolute, does NOT scroll.
              Mirrors real app's .inv-fixed-bg { position: fixed } */}
          {bgUrl ? (
            <div style={{
              position:           "absolute", inset: 0, zIndex: 0,
              backgroundImage:    `url(${bgUrl})`,
              backgroundSize:     "cover",
              backgroundPosition: "center",
              ...(!showGate && sectionBlur > 0 ? { filter: `blur(${sectionBlur}px)`, transform: "scale(1.06)" } : {}),
            }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "#0a0f1a" }} />
          )}

          {/* Video background — also non-scrolling */}
          {bgVideoUrl && (
            <video
              src={bgVideoUrl}
              autoPlay muted loop playsInline
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
            />
          )}

          {/* Scrim (text mode) */}
          {(bgUrl || bgVideoUrl) && !isPhotoMode && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.32)", zIndex: 1 }} />
          )}
          {/* Section color overlay */}
          {!showGate && sectionOverlay?.enabled && (
            <div style={{ position: "absolute", inset: 0, zIndex: 1, background: sectionOverlay.color, opacity: sectionOverlay.opacity }} />
          )}

          {/* Scrollable content area — sits above bg, contains zoom wrapper */}
          <div style={{ position: "absolute", inset: 0, overflowY: "auto", zIndex: 2, scrollbarWidth: "none" as const }}>
            <div style={{ width: CONTENT_W, zoom: SCALE as unknown as string }}>
              <div style={{ position: "relative", fontFamily: tokens.font, color: tokens.body }}>

                {/* Gate view — uses the landing-page (gate) palette */}
                {showGate && (
                  <div
                    ref={gateRef}
                    className={`pp-gate pp-reveal-${revealStyle}${playOpen ? " pp-playing" : ""}`}
                    style={{
                      height: GATE_H, position: "relative",
                      fontFamily: gateTokens.font,
                      userSelect: posMode ? "none" : undefined,
                      touchAction: posMode ? "none" : undefined,
                      overflow: "hidden",
                    }}
                  >
                    {/* Background — split into parting halves for the curtain reveal */}
                    {revealStyle === "curtain" && gateImageUrl ? (
                      <>
                        <div className="pp-curtain pp-curtain-l" style={{ position: "absolute", inset: 0, zIndex: 0, clipPath: "inset(0 50% 0 0)", backgroundImage: `url(${gateImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                        <div className="pp-curtain pp-curtain-r" style={{ position: "absolute", inset: 0, zIndex: 0, clipPath: "inset(0 0 0 50%)", backgroundImage: `url(${gateImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                      </>
                    ) : gateImageUrl ? (
                      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${gateImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, ...(backgroundBlur > 0 ? { filter: `blur(${backgroundBlur}px)`, transform: "scale(1.06)" } : {}) }} />
                    ) : null}
                    {/* Landing overlay — only when explicitly enabled. A dark
                        backdrop is kept only when there's no cover image so text stays legible. */}
                    {gateOverlay?.enabled ? (
                      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: gateOverlay.color, opacity: gateOverlay.opacity }} />
                    ) : !gateImageUrl ? (
                      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "rgba(0,0,0,0.88)" }} />
                    ) : null}

                    {/* Smart grid + alignment guides (only while positioning) */}
                    {posMode && (
                      <div style={{ position: "absolute", inset: 0, zIndex: 25, pointerEvents: "none" }}>
                        {GRID_LINES.map((p) => (
                          <div key={`v${p}`} style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: 1, background: p === 50 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)" }} />
                        ))}
                        {GRID_LINES.map((p) => (
                          <div key={`h${p}`} style={{ position: "absolute", top: `${p}%`, left: 0, right: 0, height: 1, background: p === 50 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)" }} />
                        ))}
                        {guides.x != null && (
                          <div style={{ position: "absolute", left: `${guides.x}%`, top: 0, bottom: 0, width: 2, transform: "translateX(-1px)", background: "var(--c-accent)", boxShadow: "0 0 5px var(--c-accent)" }} />
                        )}
                        {guides.y != null && (
                          <div style={{ position: "absolute", top: `${guides.y}%`, left: 0, right: 0, height: 2, transform: "translateY(-1px)", background: "var(--c-accent)", boxShadow: "0 0 5px var(--c-accent)" }} />
                        )}
                      </div>
                    )}

                    {/* Posmode hint */}
                    {posMode && (
                      <div style={{ position: "absolute", top: 10, left: 0, right: 0, zIndex: 30, textAlign: "center", pointerEvents: "none" }}>
                        <span style={{ background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 10, padding: "2px 10px", borderRadius: 4, letterSpacing: "0.05em" }}>
                          Drag to reposition · snaps to grid &amp; center
                        </span>
                      </div>
                    )}

                    {/* ── Monogram ── */}
                    {showMonogram && gateMonogramUrl && (
                      <div
                        onPointerDown={posMode ? (e) => startDrag(e, "monogram") : undefined}
                        style={{
                          position: "absolute",
                          left: getPos("monogram").xPct + "%", top: getPos("monogram").yPct + "%",
                          transform: "translate(-50%, -50%)", zIndex: 2, textAlign: "center",
                          cursor: posMode ? "grab" : "default",
                          ...(posMode ? { outline: "2px dashed rgba(255,255,255,0.6)", outlineOffset: 6, borderRadius: "50%" } : {}),
                        }}
                      >
                        <img src={gateMonogramUrl} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                      </div>
                    )}

                    {/* ── Pretitle ── */}
                    <div
                      onPointerDown={posMode ? (e) => startDrag(e, "pretitle") : undefined}
                      style={{
                        position: "absolute",
                        left: getPos("pretitle").xPct + "%", top: getPos("pretitle").yPct + "%",
                        transform: "translate(-50%, -50%)", zIndex: 2, textAlign: "center",
                        cursor: posMode ? "grab" : "default",
                        ...(posMode ? { outline: "2px dashed rgba(255,255,255,0.6)", outlineOffset: 5, borderRadius: 4, padding: "2px 8px" } : {}),
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "0.6875rem", letterSpacing: "0.2em", textTransform: "uppercase", color: gateTokens.accent, whiteSpace: "nowrap" }}>
                        You are invited to
                      </p>
                    </div>

                    {/* ── Title ── */}
                    <div
                      onPointerDown={posMode ? (e) => startDrag(e, "title") : undefined}
                      style={{
                        position: "absolute",
                        left: getPos("title").xPct + "%", top: getPos("title").yPct + "%",
                        transform: "translate(-50%, -50%)", zIndex: 2, textAlign: "center",
                        cursor: posMode ? "grab" : "default",
                        ...(posMode ? { outline: "2px dashed rgba(255,255,255,0.6)", outlineOffset: 6, borderRadius: 4, padding: "4px 10px" } : {}),
                      }}
                    >
                      <h2 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 300, fontStyle: "italic", fontFamily: gateTokens.headingFont, color: gateTokens.title, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                        {effectiveTitle}
                      </h2>
                    </div>

                    {/* ── Subtitle ── */}
                    <div
                      onPointerDown={posMode ? (e) => startDrag(e, "subtitle") : undefined}
                      style={{
                        position: "absolute",
                        left: getPos("subtitle").xPct + "%", top: getPos("subtitle").yPct + "%",
                        transform: "translate(-50%, -50%)", zIndex: 2, textAlign: "center",
                        cursor: posMode ? "grab" : "default",
                        ...(posMode ? { outline: "2px dashed rgba(255,255,255,0.6)", outlineOffset: 6, borderRadius: 4, padding: "4px 10px" } : {}),
                      }}
                    >
                      <div style={{ width: 36, height: 1, background: gateTokens.accent, opacity: 0.7, margin: "0 auto 0.5rem" }} />
                      <p style={{ margin: 0, fontSize: "0.9375rem", color: gateTokens.subtitle, whiteSpace: "nowrap" }}>
                        {coverContent.subheading || "You are cordially invited"}
                      </p>
                    </div>

                    {/* ── Guest name ── */}
                    {showGuestName && (
                      <div
                        onPointerDown={posMode ? (e) => startDrag(e, "guestName") : undefined}
                        style={{
                          position: "absolute",
                          left: getPos("guestName").xPct + "%", top: getPos("guestName").yPct + "%",
                          transform: "translate(-50%, -50%)", zIndex: 2, textAlign: "center",
                          cursor: posMode ? "grab" : "default",
                          ...(posMode ? { outline: "2px dashed rgba(255,255,255,0.6)", outlineOffset: 6, borderRadius: 4, padding: "4px 10px" } : {}),
                        }}
                      >
                        {guestFrameUrl && (
                          <img src={guestFrameUrl} alt="" aria-hidden style={{
                            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
                            width: "100vw", maxWidth: CONTENT_W, height: "auto",
                            pointerEvents: "none", zIndex: 0,
                          }} />
                        )}
                        <p style={{ margin: "0 0 0.25rem", fontSize: "0.625rem", color: gateTokens.accent, letterSpacing: "0.15em", position: "relative", zIndex: 1 }}>♥ Dear</p>
                        <div style={{ fontSize: "1.25rem", fontStyle: "italic", fontFamily: gateTokens.headingFont, color: gateTokens.primary, position: "relative", zIndex: 1, whiteSpace: "nowrap" }}>
                          Guest Name
                        </div>
                      </div>
                    )}

                    {/* ── Open Letter ── */}
                    <div
                      onPointerDown={posMode ? (e) => startDrag(e, "openBtn") : undefined}
                      style={{
                        position: "absolute",
                        left: getPos("openBtn").xPct + "%", top: getPos("openBtn").yPct + "%",
                        transform: "translate(-50%, -50%)", zIndex: 2, textAlign: "center",
                        cursor: posMode ? "grab" : "default",
                        ...(posMode ? { outline: "2px dashed rgba(255,255,255,0.6)", outlineOffset: 5, borderRadius: 999 } : {}),
                      }}
                    >
                      <div style={{ padding: "0.75rem 2rem", border: `1.5px solid ${gateTokens.accent}`, borderRadius: 999, fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: gateTokens.font, color: gateTokens.accent, whiteSpace: "nowrap" }}>
                        Open Letter
                      </div>
                    </div>
                  </div>
                )}

                {/* Sections view (default — shows edits immediately) */}
                {!showGate && (
                  <div style={{ position: "relative", zIndex: 1, userSelect: secMoveMode ? "none" : undefined }}>
                    {displaySections.length === 0 ? (
                      <div style={{ height: GATE_H, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
                        <p style={{ color: tokens.muted, fontSize: "0.9375rem", textAlign: "center", fontFamily: tokens.font }}>No sections enabled</p>
                      </div>
                    ) : (
                      displaySections.map((sec, i) => (
                        <div
                          key={`${sec.type}-${i}`}
                          data-sec-idx={i}
                          onPointerDown={secMoveMode ? (e) => startSecDrag(e, i) : undefined}
                          style={{
                            position: "relative",
                            opacity: secMoveMode && secDragIdx === i ? 0.4 : 1,
                            ...(secMoveMode ? { boxShadow: secDragIdx === i ? "inset 0 0 0 2px rgba(201,169,110,0.8)" : "inset 0 0 0 1px rgba(255,255,255,0.08)", touchAction: "none", cursor: "grab" } : {}),
                          }}
                        >
                          {/* Drag handle — visual affordance; the whole card is draggable in move mode */}
                          {secMoveMode && (
                            <div
                              style={{
                                position: "absolute", top: 0, left: 0, bottom: 0,
                                width: 28, zIndex: 10,
                                background: "rgba(0,0,0,0.55)",
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                                cursor: "grab", touchAction: "none", pointerEvents: "none",
                              }}>
                              {[0,1,2].map((d) => (
                                <div key={d} style={{ width: 10, height: 2, background: "rgba(255,255,255,0.7)", borderRadius: 1 }} />
                              ))}
                            </div>
                          )}
                          <PreviewSectionNode
                            sec={sec}
                            tokens={tokens}
                            coverUrl={coverUrl}
                            eventTitle={effectiveTitle}
                            eventDate={effectiveDate}
                            venueName={venueName ?? null}
                            venueMapUrl={venueMapUrl ?? null}
                          />
                        </div>
                      ))
                    )}
                    <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", fontSize: "0.6875rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.25, color: tokens.muted }}>
                      Made with Anjeurn
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overlay action buttons — at screen level, only visible in sections view */}
          {!showGate && <OverlayPreviewButtons overlay={overlay} />}

          {/* Layout guide overlay */}
          {showGuide && (
            <div style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none" }}>
              {showGate ? (
                <>
                  {/* Gate zone guides: Top / Middle / Bottom thirds */}
                  {(["Top", "Middle", "Bottom"] as const).map((zone, i) => (
                    <div key={zone} style={{
                      position: "absolute",
                      top: `${i * 33.33}%`, height: "33.33%", left: 0, right: 0,
                      borderTop: i > 0 ? "1px dashed rgba(255,255,255,0.4)" : undefined,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{
                        fontSize: 9, fontFamily: "monospace", letterSpacing: "0.08em",
                        padding: "1px 5px", borderRadius: 3,
                        background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.7)",
                      }}>
                        {zone}
                      </span>
                    </div>
                  ))}
                  {/* Safe zone inset */}
                  <div style={{ position: "absolute", inset: "12px 10px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }} />
                </>
              ) : (
                <>
                  {/* Sections: content-width guide + section boundaries */}
                  <div style={{ position: "absolute", inset: "0 8%", borderLeft: "1px dashed rgba(255,255,255,0.25)", borderRight: "1px dashed rgba(255,255,255,0.25)" }} />
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "2px 0", display: "flex", justifyContent: "center" }}>
                    <span style={{ fontSize: 8, fontFamily: "monospace", background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.65)", padding: "1px 5px", borderRadius: 3 }}>
                      430px content width
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div style={pp.homeArea}><div style={pp.homeBar} /></div>
      </div>

      {/* Gate / Sections toggle + Move mode */}
      <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => { setShowGate(false); setPosMode(false); }}
          style={{ fontSize: "0.6875rem", padding: "0.2rem 0.625rem", borderRadius: 4, border: "1px solid var(--c-border)", cursor: "pointer", background: !showGate ? "var(--c-accent)" : "var(--c-surface)", color: !showGate ? "#fff" : "var(--c-muted)", fontWeight: !showGate ? 600 : 400 }}
        >
          Sections
        </button>
        <button
          onClick={() => setShowGate(true)}
          style={{ fontSize: "0.6875rem", padding: "0.2rem 0.625rem", borderRadius: 4, border: "1px solid var(--c-border)", cursor: "pointer", background: showGate ? "var(--c-accent)" : "var(--c-surface)", color: showGate ? "#fff" : "var(--c-muted)", fontWeight: showGate ? 600 : 400 }}
        >
          Gate
        </button>
        {showGate && (
          <button
            onClick={() => setPosMode((m) => !m)}
            title="Drag gate elements to reposition them"
            style={{
              fontSize: "0.6875rem", padding: "0.2rem 0.625rem", borderRadius: 4,
              border: `1px solid ${posMode ? "var(--c-accent)" : "var(--c-border)"}`,
              cursor: "pointer",
              background: posMode ? "rgba(201,169,110,0.15)" : "var(--c-surface)",
              color: posMode ? "var(--c-accent)" : "var(--c-muted)",
              fontWeight: posMode ? 600 : 400,
            }}
          >
            ✥ Move
          </button>
        )}
        {showGate && (
          <button
            onClick={() => { setPosMode(false); setPlayOpen(false); requestAnimationFrame(() => setPlayOpen(true)); }}
            title="Play the opening animation"
            style={{
              fontSize: "0.6875rem", padding: "0.2rem 0.625rem", borderRadius: 4,
              border: "1px solid var(--c-border)", cursor: "pointer",
              background: "var(--c-surface)", color: "var(--c-accent)", fontWeight: 600,
            }}
          >
            ▶ Play open
          </button>
        )}
        {!showGate && (
          <button
            onClick={() => setSecMoveMode((m) => !m)}
            title="Drag sections to reorder them"
            style={{
              fontSize: "0.6875rem", padding: "0.2rem 0.625rem", borderRadius: 4,
              border: `1px solid ${secMoveMode ? "var(--c-accent)" : "var(--c-border)"}`,
              cursor: "pointer",
              background: secMoveMode ? "rgba(201,169,110,0.15)" : "var(--c-surface)",
              color: secMoveMode ? "var(--c-accent)" : "var(--c-muted)",
              fontWeight: secMoveMode ? 600 : 400,
            }}
          >
            ⠿ Reorder
          </button>
        )}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const pp = {
  outer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.625rem",
    padding: "1rem 0.875rem",
    background: "var(--c-surface-2)",
    borderLeft: "1px solid var(--c-border)",
    minHeight: "100%",
    position: "sticky" as const,
    top: 0,
  },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "0.125rem" },
  label:    { fontSize: "0.6875rem", fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
  scaleHint:{ fontSize: "0.6rem", color: "var(--c-muted)", opacity: 0.6 },
  frame: {
    width: 272,
    background: "#111827",
    borderRadius: 44,
    padding: "0 9px",
    border: "2px solid #1f2937",
    boxShadow: "0 0 0 1px #374151, inset 0 0 0 1px #0a0f1a, 0 28px 72px rgba(0,0,0,0.55)",
    flexShrink: 0,
  },
  statusBar: { height: 28, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4 },
  notch:     { width: 76, height: 20, background: "#111827", borderRadius: "0 0 16px 16px", border: "1px solid #1f2937" },
  screen: {
    width: SCREEN_W,
    height: SCREEN_H,
    borderRadius: 28,
    overflow: "hidden" as const,
    background: "#0a0f1a",
    position: "relative" as const,
  },
  homeArea: { height: 26, display: "flex", alignItems: "center", justifyContent: "center" },
  homeBar:  { width: 72, height: 4, background: "#374151", borderRadius: 2 },
} as const;
