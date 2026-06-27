import { promises as fs } from "fs";
import path from "path";

// Site-wide appearance settings, persisted to a small JSON file (no DB migration
// needed). Read by the public site (entrance + page transitions) and edited by
// admins via /admin/settings.

export type EntranceStyle = "none" | "fade" | "slideUp" | "zoom";
export type TransitionStyle = "none" | "fade" | "slide";

export interface SiteSettings {
  /** How content reveals when a page first loads (landing site). */
  entranceStyle: EntranceStyle;
  /** How pages animate when navigating between routes. */
  transitionStyle: TransitionStyle;
}

export const ENTRANCE_STYLES: EntranceStyle[] = ["none", "fade", "slideUp", "zoom"];
export const TRANSITION_STYLES: TransitionStyle[] = ["none", "fade", "slide"];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  entranceStyle: "fade",
  transitionStyle: "fade",
};

const FILE = path.join(process.cwd(), "data", "site-settings.json");

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return {
      entranceStyle: ENTRANCE_STYLES.includes(parsed.entranceStyle as EntranceStyle)
        ? (parsed.entranceStyle as EntranceStyle)
        : DEFAULT_SITE_SETTINGS.entranceStyle,
      transitionStyle: TRANSITION_STYLES.includes(parsed.transitionStyle as TransitionStyle)
        ? (parsed.transitionStyle as TransitionStyle)
        : DEFAULT_SITE_SETTINGS.transitionStyle,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function saveSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSiteSettings();
  const next: SiteSettings = { ...current, ...patch };
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}
