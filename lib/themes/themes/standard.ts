import type { ThemeModule, ThemeTokens } from "../types";

// The fallback theme: no bespoke sections, layout, or CSS — invitations render
// through the shared `.inv-*` token system (standard + DB section renderers),
// colored by overlayConfig palettes over the admin-set background image.
// These tokens were previously the invite page's inline DEFAULT_TOKENS.
// NOTE: no headingFont here — the invite page falls back to DEFAULT_FONTS.heading
// for the standard theme only, so code themes without a headingFont keep using
// their body font for headings (legacy behavior).
export const STANDARD_TOKENS: ThemeTokens = {
  id: "theme-standard",
  font: "Georgia, 'Times New Roman', serif",
  bg: "transparent",
  altBg: "rgba(0,0,0,0.10)",
  cardBg: "rgba(255,255,255,0.10)",
  coverGradient: "linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0.08))",
  text: "#ffffff",
  primary: "#ffffff",
  muted: "rgba(255,255,255,0.55)",
  accent: "#c9a96e",
  border: "rgba(201,169,110,0.44)",
  btnBg: "#c9a96e",
  btnText: "#fff",
  musicBg: "rgba(0,0,0,0.50)",
  musicColor: "#c9a96e",
  title:    "#ffffff",
  subtitle: "rgba(255,255,255,0.88)",
  header:   "#c9a96e",
  body:     "rgba(255,255,255,0.85)",
};

export const standardTheme: ThemeModule = {
  id: "theme-standard",
  name: "Standard",
  tokens: STANDARD_TOKENS,
};
