// Theme registry. Royal Khmer is the only / default theme. (Other themes were
// retired — admin designs everything on this base.)

import type { ThemeModule, ThemeTokens } from "./types";
import { royalKhmer } from "./themes/royal-khmer";

const MODULES: ThemeModule[] = [royalKhmer];

export const THEMES: Record<string, ThemeModule> = Object.fromEntries(
  MODULES.map((m) => [m.id, m])
);

export const DEFAULT_THEME = royalKhmer;

/** Resolve a theme module by id, falling back to Royal Khmer. */
export function getTheme(themeId: string): ThemeModule {
  return THEMES[themeId] ?? DEFAULT_THEME;
}

/** Resolve just the design tokens for a theme (used by thumbnails / palettes). */
export function getThemeTokens(themeId: string): ThemeTokens {
  return getTheme(themeId).tokens;
}

export { buildInviteCss, buildFontsHref } from "./shared/standard-css";
export { standardLayout } from "./shared/standard-layout";
