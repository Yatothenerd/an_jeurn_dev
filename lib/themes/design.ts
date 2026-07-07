// ── The invitation design contract ────────────────────────────────────────────
//
// ONE document describes how an invitation (or template) looks. It is the only
// thing the invite renderer reads, and the only thing editors write. Legacy
// storage (overlayConfig JSON + defaultSections + Section rows) is adapted into
// this shape by `resolveDesign` — new code must consume the design, never the
// raw columns. When the schema migration lands (WORKFLOWS.md step 3–4), the
// adapter becomes a plain deserializer.
//
// Rendering is keyed on `design.themeId` alone:
//   • a registered code theme  → that theme's sections/layout/css
//   • "theme-freeform"         → the builder canvas (overlayConfig.builderDraft)
//   • "theme-standard"         → the shared `.inv-*` token renderer
// There is no other mode selection anywhere.

import { THEMES } from "./registry";

export const FREEFORM_THEME_ID = "theme-freeform";
export const STANDARD_THEME_ID = "theme-standard";

export interface DesignPalette {
  text?: string;
  accent?: string;
  title?: string;
  subtitle?: string;
  header?: string;
  body?: string;
  muted?: string;
}

export interface DesignFonts {
  /** Title font — cover / gate titles, big numerals. */
  heading?: string;
  /** Section-header font — small uppercase labels. Falls back to `heading`. */
  header?: string;
  /** Body font — paragraphs, detail values, inputs. */
  body?: string;
  headingScale: number;
  bodyScale: number;
}

/** Floating action buttons (RSVP / gift / map / music) — admin-configurable chrome. */
export interface DesignFloatButtons {
  /** Where the stack sits over the invite. */
  position: "right" | "left" | "bar";
  /** Button silhouette. */
  shape: "circle" | "rounded" | "square";
  /** Button diameter in px. */
  size: number;
  /** Hover / press effect. */
  hover: "none" | "lift" | "glow" | "pulse";
  /** Per-button visibility (ANDed with feature availability). */
  show: { rsvp: boolean; khqr: boolean; map: boolean; music: boolean };
}

export const DEFAULT_FLOAT_BUTTONS: DesignFloatButtons = {
  position: "right",
  shape: "circle",
  size: 46,
  hover: "lift",
  show: { rsvp: true, khqr: true, map: true, music: true },
};

export interface DesignOverlay {
  enabled: boolean;
  color: string;
  opacity: number;
}

export type GateElementKey = "monogram" | "pretitle" | "title" | "subtitle" | "guestName" | "openBtn";

/** Hand icon used on the gate "open" button and the guidance overlay. */
export interface DesignHand {
  kind: "default" | "emoji" | "image";
  /** Emoji character or image URL (unused for "default"). */
  value: string;
}

export interface DesignGate {
  revealStyle: "fade" | "envelope" | "curtain" | "slideUp";
  keepCoverAfterOpen: boolean;
  scrollGuide: boolean;
  /** Guidance-overlay caption shown once after opening (admin-customizable). */
  guideText: string;
  /** Hand icon for the open button + guidance overlay. */
  hand: DesignHand;
  /** Plain background color for the gate (used when no cover image is set). */
  bgColor: string | null;
  position: "top" | "center" | "bottom";
  overlay: DesignOverlay;
  backgroundBlur: number;
  showGuestName: boolean;
  guestFrameUrl: string | null;
  monogram: { gate: boolean; sections: boolean };
  elementPositions?: Partial<Record<GateElementKey, { xPct: number; yPct: number }>>;
}

/** Bilingual content: guests toggle the whole invitation between two languages. */
export interface DesignLanguages {
  enabled: boolean;
  /** Label for the base-content language (e.g. "ខ្មែរ"). */
  primaryLabel: string;
  /** Label for the alternate language stored in each section's `content.i18n` (e.g. "EN"). */
  secondaryLabel: string;
}

export interface DesignPage {
  sectionBlur: number;
  sectionOverlay: DesignOverlay;
  /** null = follow the theme's music colors. */
  actionButton: { bg: string; color: string } | null;
  showRsvp: boolean;
  floatButtons: DesignFloatButtons;
  /** Plain background color for the sections (used when no background media is set). */
  bgColor: string | null;
  languages: DesignLanguages;
}

export interface DesignSection {
  id: string;
  type: string;
  sortOrder: number;
  included: boolean;
  content: unknown;
}

export interface InvitationDesign {
  /** Always resolved to a registered theme id — never empty. */
  themeId: string;
  palette: DesignPalette;
  /** Landing page (gate) palette; falls back to `palette`. */
  gatePalette: DesignPalette;
  fonts: DesignFonts;
  gate: DesignGate;
  page: DesignPage;
  sections: DesignSection[];
  /** Builder canvas state — only meaningful when themeId is theme-freeform. */
  builderDraft: unknown | null;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

interface LegacyOverlay {
  themeId?: unknown;
  builderDraft?: unknown;
  colorScheme?: DesignPalette;
  gateColorScheme?: DesignPalette;
  fonts?: { heading?: string; header?: string; body?: string; headingScale?: number; bodyScale?: number };
  floatButtons?: Partial<DesignFloatButtons>;
  guideText?: string;
  guideHand?: DesignHand;
  gateBgColor?: string | null;
  pageBgColor?: string | null;
  languages?: Partial<DesignLanguages>;
  backgroundBlur?: number;
  sectionBlur?: number;
  sectionOverlay?: DesignOverlay;
  gateOverlay?: DesignOverlay;
  actionButton?: { bg: string; color: string };
  revealStyle?: DesignGate["revealStyle"];
  keepCoverAfterOpen?: boolean;
  scrollGuide?: boolean;
  gatePosition?: DesignGate["position"];
  showGuestName?: boolean;
  guestFrameUrl?: string | null;
  monogram?: { gate: boolean; sections: boolean };
  elementPositions?: DesignGate["elementPositions"];
  showRsvp?: boolean;
}

function isBuilderDraft(v: unknown): boolean {
  return !!v && typeof v === "object" && Array.isArray((v as { sections?: unknown }).sections);
}

/**
 * Build the design document from an invitation's (or template's) stored state.
 * `sectionRows` are the legacy `Section` table rows, used only when the
 * `defaultSections` JSON is absent.
 */
export function resolveDesign(input: {
  overlayConfig: unknown;
  defaultSections: unknown;
  sectionRows?: Array<{ id: string; type: string; sortOrder: number; content: unknown }>;
}): InvitationDesign {
  const oc = (input.overlayConfig ?? {}) as LegacyOverlay;

  const builderDraft = isBuilderDraft(oc.builderDraft) ? oc.builderDraft! : null;

  // Renderer resolution — the single precedence rule of the system.
  let themeId = typeof oc.themeId === "string" && THEMES[oc.themeId] ? (oc.themeId as string) : "";
  if (!themeId) themeId = builderDraft ? FREEFORM_THEME_ID : STANDARD_THEME_ID;
  if (themeId === FREEFORM_THEME_ID && !builderDraft) themeId = STANDARD_THEME_ID;

  // Sections: the defaultSections JSON wins; Section rows are the fallback.
  const rawDs = input.defaultSections;
  let sections: DesignSection[];
  if (Array.isArray(rawDs) && rawDs.length > 0 && typeof rawDs[0] === "object" && rawDs[0] !== null) {
    sections = (rawDs as Array<{ type: string; included?: boolean; content?: unknown }>).map((s, i) => ({
      id: `ds-${i}`,
      type: s.type,
      sortOrder: i,
      included: !!s.included,
      content: s.content ?? {},
    }));
  } else {
    sections = (input.sectionRows ?? []).map((r) => ({ ...r, included: true }));
  }

  return {
    themeId,
    palette: oc.colorScheme ?? {},
    gatePalette: oc.gateColorScheme ?? oc.colorScheme ?? {},
    fonts: {
      heading: oc.fonts?.heading || undefined,
      header: oc.fonts?.header || undefined,
      body: oc.fonts?.body || undefined,
      headingScale: oc.fonts?.headingScale ?? 1,
      bodyScale: oc.fonts?.bodyScale ?? 1,
    },
    gate: {
      revealStyle: oc.revealStyle ?? "fade",
      keepCoverAfterOpen: oc.keepCoverAfterOpen ?? true,
      scrollGuide: oc.scrollGuide ?? true,
      guideText: oc.guideText || "Scroll to explore",
      hand: oc.guideHand ?? { kind: "default", value: "" },
      bgColor: oc.gateBgColor ?? null,
      position: oc.gatePosition ?? "center",
      overlay: oc.gateOverlay ?? { enabled: false, color: "#000000", opacity: 0.45 },
      backgroundBlur: oc.backgroundBlur ?? 0,
      showGuestName: oc.showGuestName ?? true,
      guestFrameUrl: oc.guestFrameUrl ?? null,
      monogram: oc.monogram ?? { gate: true, sections: false },
      elementPositions: oc.elementPositions ?? undefined,
    },
    page: {
      sectionBlur: oc.sectionBlur ?? 0,
      sectionOverlay: oc.sectionOverlay ?? { enabled: false, color: "#000000", opacity: 0.25 },
      actionButton: oc.actionButton ?? null,
      showRsvp: oc.showRsvp ?? true,
      floatButtons: {
        ...DEFAULT_FLOAT_BUTTONS,
        ...(oc.floatButtons ?? {}),
        show: { ...DEFAULT_FLOAT_BUTTONS.show, ...(oc.floatButtons?.show ?? {}) },
      },
      bgColor: oc.pageBgColor ?? null,
      languages: {
        enabled: oc.languages?.enabled ?? false,
        primaryLabel: oc.languages?.primaryLabel || "ខ្មែរ",
        secondaryLabel: oc.languages?.secondaryLabel || "EN",
      },
    },
    sections,
    builderDraft,
  };
}
