// Theme registry — every rendering engine the invite page can use.
//
// "standard" is the token fallback (shared `.inv-*` system), "freeform" wraps
// the builder canvas, and the rest are bespoke code themes. design.themeId
// (see ./design.ts) always resolves to exactly one of these.

import type { ThemeModule, ThemeTokens } from "./types";
import { standardTheme } from "./themes/standard";
import { freeformTheme } from "./themes/freeform";
import { royalKhmer } from "./themes/royal-khmer";
import { sweetHearts } from "./themes/sweet-hearts";
import { lovelyBook } from "./themes/lovely-book";
import { minimalFloral } from "./themes/minimal-floral";
import { sandBeach } from "./themes/sand-beach";
import { royalTicket } from "./themes/royal-ticket";

const MODULES: ThemeModule[] = [standardTheme, freeformTheme, royalKhmer, sweetHearts, lovelyBook, minimalFloral, sandBeach, royalTicket];

export const THEMES: Record<string, ThemeModule> = Object.fromEntries(
  MODULES.map((m) => [m.id, m])
);

export const DEFAULT_THEME = standardTheme;

/** Resolve a theme module by id, falling back to Standard. */
export function getTheme(themeId: string): ThemeModule {
  return THEMES[themeId] ?? DEFAULT_THEME;
}

/** Resolve just the design tokens for a theme (used by thumbnails / palettes). */
export function getThemeTokens(themeId: string): ThemeTokens {
  return getTheme(themeId).tokens;
}

/** Serializable summary of every registered theme (safe to pass server → client). */
export interface ThemeSummary {
  id: string;
  name: string;
  /** How the theme renders: bespoke code sections, the builder canvas, or the token fallback. */
  kind: "code" | "builder" | "standard";
  /** Preset themes are design-locked — only content edits are allowed. */
  locked: boolean;
  palette: { bg: string; primary: string; accent: string; text: string };
}

export function listThemeSummaries(): ThemeSummary[] {
  return MODULES.map((m) => ({
    id: m.id,
    name: m.name,
    kind: m.id === "theme-freeform" ? "builder" : m.id === "theme-standard" ? "standard" : "code",
    locked: !!m.preset,
    palette: {
      bg: m.tokens.bg,
      primary: m.tokens.primary,
      accent: m.tokens.accent,
      text: m.tokens.text,
    },
  }));
}

export { buildInviteCss, buildFontsHref } from "./shared/standard-css";
export { standardLayout } from "./shared/standard-layout";
