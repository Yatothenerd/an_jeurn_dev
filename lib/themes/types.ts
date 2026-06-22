// ── Theme system types ──────────────────────────────────────────────────────
//
// A theme is a *module*, not just a bag of colors. Token-only themes (the shared
// `.inv-*` design system, recolored) describe themselves entirely with `tokens`.
// Bespoke themes (Royal Khmer, animated, video) additionally bring their own
// `css`, `fonts`, `assets`, per-section component overrides, and `layout` chrome.
//
// The invite page resolves a theme to: standard section renderers overridden by
// `sections`, the standard layout overridden by `layout`, and CSS/fonts that
// ship ONLY what the active theme needs (see registry.buildInviteCss).

import type { ComponentType, ReactNode } from "react";

export type ThemeFamily = "standard" | "khmer" | "custom";

/** Design tokens — the recolorable surface of the shared `.inv-*` system. */
export interface ThemeTokens {
  id?: string;
  /** Body font stack for the invite. */
  font: string;
  /** Display/heading font stack (cover title, gate title, countdown digits). Falls back to `font`. */
  headingFont?: string;
  /** Size multiplier for heading text (default 1). */
  headingScale?: number;
  /** Size multiplier for body text (default 1). */
  bodyScale?: number;
  family?: ThemeFamily;
  /** Primary page / section background. */
  bg: string;
  /** Alternating section background (every other section). */
  altBg: string;
  /** Raised card surface (detail cards, countdown units, wishes). */
  cardBg: string;
  /** Cover hero gradient. */
  coverGradient: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
  /** DB-theme semantic color for h1 / main title (falls back to text). */
  title?: string;
  /** DB-theme semantic color for subtitle paragraphs (falls back to text). */
  subtitle?: string;
  /** DB-theme semantic color for section-header labels (falls back to accent). */
  header?: string;
  /** DB-theme semantic color for body text and detail values (falls back to text). */
  body?: string;
  /** Hairline border used on cards (already includes alpha). */
  border: string;
  btnBg: string;
  btnText: string;
  musicBg: string;
  musicColor: string;
  /** Decorative gem glyph in the cover ornament line. */
  gem?: string;
  /** Cover corner treatment: simple lines, or the damask mask ornament. */
  cornerStyle?: "line" | "damask";
  /** Optional decorative band below the cover. */
  decoBand?: { pattern: "floral" | "lace"; blend: "mul" | "screen" } | null;
  /** When true, the cover section hides its content/hero photo. */
  hideCoverPhoto?: boolean;
  /** When true, the cover section shows the monogram circle. */
  showMonogramInSections?: boolean;
}

/** @deprecated Back-compat alias. Prefer {@link ThemeTokens}. */
export type ThemeConfig = ThemeTokens;

export type SectionType =
  | "cover"
  | "countdown"
  | "agenda"
  | "details"
  | "gallery"
  | "video"
  | "khqr"
  | "wishing"
  | "image"
  | "guestlist";

/**
 * Per-section component overrides. Intentionally loosely typed: every section
 * owns its own props interface and the page dispatcher passes the matching
 * props per type. A theme supplies only the sections it wants to change.
 */
export type SectionComponents = Partial<Record<SectionType, ComponentType<any>>>;

export interface SectionWrapContext {
  type: SectionType;
  /** Running index of rendered non-cover sections, for background alternation. */
  index: number;
  tokens: ThemeTokens;
}

export interface FooterContext {
  tokens: ThemeTokens;
  eventTitle: string;
}

/** Chrome a theme draws around the shell and individual sections. */
export interface ThemeLayout {
  /** Extra className on the `.invite-shell` root (e.g. "rk-invite"). */
  shellClass?: string;
  /** Wrap the cover section's rendered node. */
  wrapCover?(node: ReactNode, tokens: ThemeTokens): ReactNode;
  /** Wrap a non-cover section's rendered node. */
  wrapSection?(node: ReactNode, ctx: SectionWrapContext): ReactNode;
  /** Rendered once after all sections (e.g. a closing panel). */
  footer?(ctx: FooterContext): ReactNode;
}

export interface ThemeModule {
  id: string;
  name: string;
  tokens: ThemeTokens;
  /** Bespoke CSS injected only when this theme is the active one. */
  css?: string;
  /**
   * Extra Google-font family specs appended to the base href for this theme,
   * e.g. "Dancing+Script:wght@400;600". Base serif/script families are always
   * loaded (see shared/standard-css.ts).
   */
  fonts?: string[];
  /** Static assets the theme's components consume (video src, poster, …). */
  assets?: Record<string, string>;
  /** Section component overrides; unspecified sections use the standard renderer. */
  sections?: SectionComponents;
  /** Section / shell chrome; falls back to the standard layout. */
  layout?: ThemeLayout;
  /**
   * When true, the builder shows a per-section background image/video uploader
   * (image/video themes read `content.bgUrl` / `content.bgVideo`).
   */
  usesBackgrounds?: boolean;
  /**
   * When true, the whole invite renders over ONE fixed background
   * (Invitation.backgroundUrl, admin-set) and sections overlay it as panels.
   */
  singleBackground?: boolean;
}
