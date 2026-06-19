// Theme registry — the single place that knows every theme. Add a new theme by
// creating its module under themes/ and registering it here.

import type { ThemeModule, ThemeTokens } from "./types";
import { classicWhite } from "./themes/classic-white";
import { navyToile } from "./themes/navy-toile";
import { roseGarden } from "./themes/rose-garden";
import { vintageLace } from "./themes/vintage-lace";
import { cocoaDoily } from "./themes/cocoa-doily";
import { oliveArch } from "./themes/olive-arch";
import { champagneNoir } from "./themes/champagne-noir";
import { royalKhmer } from "./themes/royal-khmer";
import { starlight } from "./themes/starlight";
import { cinematic } from "./themes/cinematic";

const MODULES: ThemeModule[] = [
  classicWhite,
  navyToile,
  roseGarden,
  vintageLace,
  cocoaDoily,
  oliveArch,
  champagneNoir,
  royalKhmer,
  starlight,
  cinematic,
];

export const THEMES: Record<string, ThemeModule> = Object.fromEntries(
  MODULES.map((m) => [m.id, m])
);

export const DEFAULT_THEME = classicWhite;

/** Resolve a theme module by id, falling back to the default theme. */
export function getTheme(themeId: string): ThemeModule {
  return THEMES[themeId] ?? DEFAULT_THEME;
}

/** Resolve just the design tokens for a theme (used by thumbnails / palettes). */
export function getThemeTokens(themeId: string): ThemeTokens {
  return getTheme(themeId).tokens;
}

export { buildInviteCss, buildFontsHref } from "./shared/standard-css";
export { standardLayout } from "./shared/standard-layout";
