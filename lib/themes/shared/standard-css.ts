// Shared invite design system, ported from theme-preview.html so the live
// invitation renders identically to the showcase. This file owns the *standard*
// `.inv-*` structure, spacing and decoration; per-theme colors are applied
// through inline styles in the section components. Bespoke themes (Khmer,
// animated, video) add their own CSS via `ThemeModule.css`.

import type { ThemeModule } from "../types";

// Base Google-font families always loaded (the serif/script set the `.inv-*`
// system relies on). Bespoke themes append more via `ThemeModule.fonts`.
const BASE_FONT_FAMILIES = [
  "Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500",
  "Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500",
  "Great+Vibes",
  "Montserrat:wght@300;400;500;600",
  "Cinzel:wght@400;500",
  // Extra families offered by the event font picker (see FONT_OPTIONS).
  "Dancing+Script:wght@400;500;600;700",
  "Lato:wght@300;400;700",
  "EB+Garamond:ital,wght@0,400;0,500;1,400",
  "Marcellus",
];

// ── Event font picker ─────────────────────────────────────────────────────────
// Curated font choices surfaced in the EventWizard. Each maps a friendly label
// to a CSS font stack. Every family here is loaded via BASE_FONT_FAMILIES, so
// any pick renders without extra network work.

export interface FontOption { label: string; stack: string }

export const HEADING_FONTS: FontOption[] = [
  { label: "Playfair Display",   stack: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant Garamond", stack: "'Cormorant Garamond', Georgia, serif" },
  { label: "Cinzel",             stack: "'Cinzel', Georgia, serif" },
  { label: "Marcellus",          stack: "'Marcellus', Georgia, serif" },
  { label: "EB Garamond",        stack: "'EB Garamond', Georgia, serif" },
  { label: "Great Vibes",        stack: "'Great Vibes', cursive" },
  { label: "Dancing Script",     stack: "'Dancing Script', cursive" },
];

export const BODY_FONTS: FontOption[] = [
  { label: "Montserrat",         stack: "'Montserrat', sans-serif" },
  { label: "Lato",               stack: "'Lato', sans-serif" },
  { label: "EB Garamond",        stack: "'EB Garamond', Georgia, serif" },
  { label: "Cormorant Garamond", stack: "'Cormorant Garamond', Georgia, serif" },
  { label: "Georgia",            stack: "Georgia, 'Times New Roman', serif" },
];

export const DEFAULT_FONTS = {
  heading: "'Playfair Display', Georgia, serif",
  body:    "Georgia, 'Times New Roman', serif",
};

/** Build the Google Fonts stylesheet href: base families + the theme's extras. */
export function buildFontsHref(extra: string[] = []): string {
  const families = [...BASE_FONT_FAMILIES, ...extra];
  return (
    "https://fonts.googleapis.com/css2?" +
    families.map((f) => "family=" + f).join("&") +
    "&display=swap"
  );
}

/** Globals + the shared `.inv-*` standard design system. */
export const STANDARD_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #e7e3dc; }
img { max-width: 100%; }

.invite-shell {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 40px rgba(0,0,0,0.18);
  overflow: hidden;
  padding-bottom: 6.5rem;
}

/* ── Single fixed background (Spotlight-style themes) ── */
/* Background is constrained to the same 430px as the invite shell so it
   stays locked to mobile dimensions on desktop rather than filling the
   full viewport and distorting the image. */
.inv-fixed-bg {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  z-index: 0;
  overflow: hidden;
}
.inv-fixed-bg-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  object-fit: cover;
  object-position: center center;
}
.inv-fixed-bg-scrim {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.28);
}

/* ── Cover ── */
.inv-cover {
  padding: 4rem 1.5rem 3rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-height: 78vh;
  justify-content: center;
  position: relative;
}
.inv-pretitle { font-size: 0.7rem; letter-spacing: 0.25em; text-transform: uppercase; opacity: 0.75; }
.inv-script { font-family: 'Great Vibes', cursive; font-size: 3.4rem; line-height: 1.1; }
.inv-amp { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 300; font-style: italic; opacity: 0.55; margin: -0.4rem 0; }
.inv-ornament-line { display: flex; align-items: center; gap: 0.625rem; width: 78%; max-width: 320px; }
.inv-ornament-line .line { flex: 1; height: 1px; background: currentColor; opacity: 0.25; }
.inv-ornament-line .gem { font-size: 0.7rem; opacity: 0.6; }
.inv-date { font-size: 0.78rem; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.8; }
.inv-venue-snippet { font-size: 0.82rem; letter-spacing: 0.04em; opacity: 0.6; font-style: italic; }

/* Cover guest greeting (personalized) */
.inv-greeting { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; width: 100%; max-width: 340px; margin: 0.4rem auto; }
.inv-greeting-label { font-size: 0.62rem; letter-spacing: 0.18em; text-transform: uppercase; padding: 0.3rem 0.9rem; border: 1px solid; border-radius: 999px; opacity: 0.85; }
.inv-greeting-name { width: 100%; padding: 0.7rem 1rem; border: 1px solid; border-radius: 12px; font-size: 1.05rem; letter-spacing: 0.02em; }

/* Simple line corners */
.inv-corner { position: absolute; width: 26px; height: 26px; opacity: 0.35; }
.inv-corner.tl { top: 16px; left: 16px; border-top: 1px solid currentColor; border-left: 1px solid currentColor; }
.inv-corner.tr { top: 16px; right: 16px; border-top: 1px solid currentColor; border-right: 1px solid currentColor; }
.inv-corner.bl { bottom: 16px; left: 16px; border-bottom: 1px solid currentColor; border-left: 1px solid currentColor; }
.inv-corner.br { bottom: 16px; right: 16px; border-bottom: 1px solid currentColor; border-right: 1px solid currentColor; }

/* Damask mask corners (Champagne Noir / accents) */
.inv-corner-orn { position: absolute; width: 52px; height: 66px; background: currentColor; -webkit-mask: url('/themes/borders/corner-damask.png') center / contain no-repeat; mask: url('/themes/borders/corner-damask.png') center / contain no-repeat; pointer-events: none; opacity: 0.9; }
.orn-tl { top: 14px; left: 14px; }
.orn-tr { top: 14px; right: 14px; transform: scaleX(-1); }
.orn-bl { bottom: 14px; left: 14px; transform: scaleY(-1); }
.orn-br { bottom: 14px; right: 14px; transform: scale(-1, -1); }

/* ── Sections ── */
.inv-section { padding: 2.75rem 1.5rem; }
.inv-section-title { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
.inv-section-title .line { flex: 1; height: 1px; background: currentColor; opacity: 0.14; }
.inv-section-title span { font-size: 0.66rem; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.55; white-space: nowrap; }

/* Detail / agenda card */
.inv-detail-card { border-radius: 14px; overflow: hidden; border: 1px solid; }
.inv-detail-row { display: flex; align-items: flex-start; gap: 0.875rem; padding: 1rem 1.1rem; }
.inv-detail-icon { font-size: 1.1rem; margin-top: 1px; flex-shrink: 0; }
.inv-detail-label { font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.6; margin-bottom: 0.2rem; font-family: 'Montserrat', sans-serif; }
.inv-detail-value { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 400; }
.inv-map-link { font-size: 0.9rem; font-weight: 500; text-decoration: none; font-family: 'Montserrat', sans-serif; }

/* Countdown */
.inv-countdown { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
.inv-cd-unit { border-radius: 12px; padding: 1rem 0.25rem; text-align: center; border: 1px solid; }
.inv-cd-num { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 500; line-height: 1; display: block; }
.inv-cd-lbl { font-size: 0.55rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6; font-family: 'Montserrat', sans-serif; margin-top: 0.35rem; display: block; }

/* Agenda */
.inv-agenda-row { display: flex; align-items: center; gap: 0.85rem; padding: 0.85rem 1rem; }
.inv-agenda-icon { width: 38px; height: 38px; flex-shrink: 0; object-fit: contain; }
.inv-agenda-time { font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-weight: 600; min-width: 46px; flex-shrink: 0; text-align: center; }
.inv-agenda-time small { display: block; font-size: 0.55rem; font-weight: 400; opacity: 0.8; font-family: 'Montserrat', sans-serif; }
.inv-agenda-label { font-size: 0.86rem; line-height: 1.35; }

/* Photo grid */
.inv-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.3rem; }
.inv-photo { aspect-ratio: 1; border-radius: 6px; overflow: hidden; display: block; padding: 0; border: none; cursor: pointer; }
.inv-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.inv-photos.masonry { grid-template-columns: repeat(2, 1fr); }

/* Wish */
.inv-wish { border-radius: 14px; padding: 1.1rem 1.2rem; border: 1px solid; margin-bottom: 0.75rem; }
.inv-wish-msg { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.95rem; line-height: 1.65; margin: 0 0 0.5rem; }
.inv-wish-from { font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; opacity: 0.6; margin: 0; }
.inv-wish-form { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
.inv-wish-input { width: 100%; padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid; background: transparent; font-family: 'Montserrat', sans-serif; font-size: 0.85rem; color: inherit; }
.inv-wish-send { padding: 0.65rem; border: none; border-radius: 999px; font-family: 'Montserrat', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; }

/* Decorative band */
.inv-deco-band { height: 42px; background-repeat: repeat-x; background-position: center; background-size: auto 130%; opacity: 0.6; }
.inv-deco-band.blend-mul { mix-blend-mode: multiply; }
.inv-deco-band.blend-screen { mix-blend-mode: screen; }
.inv-deco-band.floral { background-image: url('/themes/patterns/gold-floral-damask.jpg'); }
.inv-deco-band.lace { background-image: url('/themes/patterns/thai-lace-border.jpg'); }

/* ── Opening gate + scroll guide (universal — every theme opens with this) ── */
.inv-gate { position: fixed; inset: 0; z-index: 2000; max-width: 430px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; padding: 3.5rem 1.5rem; }
.inv-gate.is-opening { animation: inv-gate-out 0.7s ease forwards; }
@keyframes inv-gate-out { to { opacity: 0; transform: scale(1.06); visibility: hidden; } }
.inv-gate-guest { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin: 0.2rem 0 0.4rem; }
.inv-gate-name { font-family: 'Great Vibes', cursive; font-size: 2rem; line-height: 1.1; }
.inv-gate-open { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.6rem; margin-top: 0.6rem; }
.inv-gate-hand { width: 88px; height: auto; animation: inv-tap 1.6s ease-in-out infinite; }
@keyframes inv-tap { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-7px) scale(1.07); } }
.inv-gate-open-label { font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase; padding: 0.4rem 1rem; border: 1px solid; border-radius: 999px; }

.inv-guide { position: fixed; inset: 0; z-index: 2100; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.9rem; background: rgba(0,0,0,0.55); color: #fff; cursor: pointer; }
.inv-guide-hand { width: 58px; height: auto; animation: inv-pan 1.6s ease-in-out infinite; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4)); }
@keyframes inv-pan { 0%, 100% { transform: translateY(-10px); } 50% { transform: translateY(14px); } }
.inv-guide-text { font-family: 'Montserrat', sans-serif; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.9; margin: 0; }

@media (prefers-reduced-motion: reduce) {
  .inv-gate-hand, .inv-guide-hand { animation: none; }
}

@media (max-width: 480px) { body { font-size: 16px; } }

/* ── Invite page base — dark foundation so sections look polished without a bg image ── */
body { background: #0c0c14; }
.invite-shell { position: relative; z-index: 1; }

/* ── Section entrance animations ── */
@keyframes inv-fade-up   { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
@keyframes inv-fade-in   { from { opacity: 0; } to { opacity: 1; } }
@keyframes inv-scale-in  { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
@keyframes inv-slide-right { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes inv-shimmer   { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
@keyframes inv-float     { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes inv-glow-pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.18) drop-shadow(0 0 8px currentColor); } }

.inv-animate section    { animation: inv-fade-up 0.75s ease both; }
.inv-animate section:nth-child(1) { animation-delay: 0.05s; }
.inv-animate section:nth-child(2) { animation-delay: 0.15s; }
.inv-animate section:nth-child(3) { animation-delay: 0.25s; }
.inv-animate section:nth-child(4) { animation-delay: 0.35s; }
.inv-animate section:nth-child(5) { animation-delay: 0.45s; }
.inv-animate section:nth-child(6) { animation-delay: 0.55s; }
.inv-animate section:nth-child(7) { animation-delay: 0.65s; }
.inv-animate .inv-ornament-line   { animation: inv-slide-right 0.8s ease both; animation-delay: 0.3s; }
.inv-animate .inv-pretitle        { animation: inv-fade-in 0.7s ease both; animation-delay: 0.1s; }
.inv-animate .inv-script          { animation: inv-scale-in 0.9s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.2s; }
.inv-animate .inv-gate-hand       { animation: inv-tap 1.6s ease-in-out infinite, inv-glow-pulse 3s ease-in-out infinite; }
.inv-animate .inv-gate-name       { animation: inv-scale-in 0.85s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.45s; }
.inv-animate .inv-gate-guest      { animation: inv-fade-up 0.7s ease both; animation-delay: 0.5s; }
.inv-animate .inv-gate-open       { animation: inv-fade-up 0.7s ease both; animation-delay: 0.7s; }

@media (prefers-reduced-motion: reduce) {
  .inv-animate section, .inv-animate .inv-ornament-line, .inv-animate .inv-pretitle,
  .inv-animate .inv-script, .inv-animate .inv-gate-name, .inv-animate .inv-gate-guest,
  .inv-animate .inv-gate-open { animation: none; }
}
`;

/**
 * Compose the CSS injected for the active theme: the shared standard system
 * plus the theme's own bespoke CSS (Khmer `.rk-*`, animation keyframes, etc.).
 * Non-active themes' CSS never ships to the page.
 */
export function buildInviteCss(theme: ThemeModule): string {
  return STANDARD_CSS + (theme.css ?? "");
}
