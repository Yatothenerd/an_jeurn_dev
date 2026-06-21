"use client";

import { useState, useEffect } from "react";
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

export interface PreviewColorScheme {
  text: string; accent: string;
  title: string; subtitle: string; header: string; body: string; muted: string;
}

export interface PreviewOverlay {
  style:   "floating" | "bottomBar";
  map:     { enabled: boolean };
  music:   { enabled: boolean };
  goToTop: { enabled: boolean };
  gifts:   { enabled: boolean };
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

function buildTokens(c: PreviewColorScheme, isPhotoMode: boolean): ThemeTokens {
  return {
    ...DEFAULT_TOKENS,
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

function OverlayPreviewButtons({ overlay, tokens }: { overlay: PreviewOverlay; tokens: ThemeTokens }) {
  const showGifts = overlay.gifts.enabled;
  const showMap   = overlay.map.enabled;
  const showMusic = overlay.music.enabled;
  if (!showGifts && !showMap && !showMusic) return null;

  const btn: React.CSSProperties = {
    width:           BTN_SIZE,
    height:          BTN_SIZE,
    borderRadius:    "50%",
    background:      tokens.musicBg,
    color:           tokens.musicColor,
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
}: PhonePreviewProps) {
  const bgImageObjUrl = useObjectUrl(bgAssetType === "image" ? bgImageFile : null);
  const bgVideoObjUrl = useObjectUrl(bgAssetType === "video" ? bgVideoFile : null);
  const coverObjUrl   = useObjectUrl(coverFile);

  const bgUrl      = bgAssetType === "image" ? (bgImageObjUrl ?? existingBgUrl ?? null) : null;
  const bgVideoUrl = bgAssetType === "video" ? (bgVideoObjUrl ?? existingBgVideoUrl ?? null) : null;
  const coverUrl   = coverObjUrl ?? existingCoverUrl ?? null;

  const isPhotoMode = contentType === "photo";
  const tokens      = buildTokens(colorScheme, isPhotoMode);
  const [showGate, setShowGate] = useState(false);

  const activeSections = sections.filter((s) => s.included);
  const coverContent   = (activeSections.find((s) => s.type === "cover")?.content ?? {}) as { heading?: string; subheading?: string };

  const gateImageUrl = coverUrl || bgUrl;

  const effectiveTitle = eventTitle || coverContent.heading || "Our Special Day";
  const effectiveDate  = eventDate  || new Date(Date.now() + 30 * 86400000).toISOString();

  return (
    <div style={pp.outer}>
      <div style={pp.labelRow}>
        <span style={pp.label}>{showGate ? "Gate Preview" : "Live Preview"}</span>
        <span style={pp.scaleHint}>Mobile · 430px</span>
      </div>

      {/* Phone frame */}
      <div style={pp.frame}>
        <div style={pp.statusBar}><div style={pp.notch} /></div>

        {/* Screen — overflow:hidden clips rounded corners; bg + scroll are separate children */}
        <div style={pp.screen}>

          {/* Background layer — position:absolute, does NOT scroll.
              Mirrors real app's .inv-fixed-bg { position: fixed } */}
          {bgUrl ? (
            <div style={{
              position:           "absolute", inset: 0, zIndex: 0,
              backgroundImage:    `url(${bgUrl})`,
              backgroundSize:     "cover",
              backgroundPosition: "center",
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

          {/* Scrollable content area — sits above bg, contains zoom wrapper */}
          <div style={{ position: "absolute", inset: 0, overflowY: "auto", zIndex: 2, scrollbarWidth: "none" as const }}>
            <div style={{ width: CONTENT_W, zoom: SCALE as unknown as string }}>
              <div style={{ position: "relative", fontFamily: tokens.font, color: tokens.body }}>

                {/* Gate view */}
                {showGate && (
                  <div style={{ height: GATE_H, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    {gateImageUrl && (
                      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${gateImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: gateImageUrl ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.88)", zIndex: 0 }} />
                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", textAlign: "center", padding: "2rem" }}>
                      <p style={{ margin: 0, fontSize: "0.6875rem", letterSpacing: "0.2em", textTransform: "uppercase", color: tokens.accent }}>
                        You are invited to
                      </p>
                      <h2 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 300, fontStyle: "italic", color: tokens.title, lineHeight: 1.2 }}>
                        {effectiveTitle}
                      </h2>
                      <div style={{ width: 36, height: 1, background: tokens.accent, opacity: 0.7 }} />
                      <p style={{ margin: 0, fontSize: "0.9375rem", color: tokens.subtitle }}>
                        {coverContent.subheading || "You are cordially invited"}
                      </p>
                      <div style={{ marginTop: "1.5rem", padding: "0.75rem 2rem", border: `1.5px solid ${tokens.accent}`, borderRadius: 999, fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: tokens.font, color: tokens.accent }}>
                        Open Letter
                      </div>
                    </div>
                  </div>
                )}

                {/* Sections view (default — shows edits immediately) */}
                {!showGate && (
                  <div style={{ position: "relative", zIndex: 1 }}>
                    {activeSections.length === 0 ? (
                      <div style={{ height: GATE_H, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
                        <p style={{ color: tokens.muted, fontSize: "0.9375rem", textAlign: "center", fontFamily: tokens.font }}>No sections enabled</p>
                      </div>
                    ) : (
                      activeSections.map((sec, i) => (
                        <PreviewSectionNode
                          key={`${sec.type}-${i}`}
                          sec={sec}
                          tokens={tokens}
                          coverUrl={coverUrl}
                          eventTitle={effectiveTitle}
                          eventDate={effectiveDate}
                          venueName={venueName ?? null}
                          venueMapUrl={venueMapUrl ?? null}
                        />
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
          {!showGate && <OverlayPreviewButtons overlay={overlay} tokens={tokens} />}
        </div>

        <div style={pp.homeArea}><div style={pp.homeBar} /></div>
      </div>

      {/* Gate / Sections toggle below the phone */}
      <div style={{ display: "flex", gap: "0.375rem" }}>
        <button
          onClick={() => setShowGate(false)}
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
