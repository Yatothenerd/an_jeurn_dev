import type { ThemeModule } from "../types";

// The builder canvas wrapped as a theme. When design.themeId resolves to this
// id, the invite page renders BuilderInvite from design.builderDraft instead of
// the section pipeline — that branch lives in the invite page because the
// builder ships its own full-page renderer. Tokens exist only for pickers and
// thumbnails (dark canvas defaults from lib/builder/canvas.tsx freshState).
export const freeformTheme: ThemeModule = {
  id: "theme-freeform",
  name: "Freeform (Builder)",
  tokens: {
    id: "theme-freeform",
    font: "Georgia, 'Times New Roman', serif",
    bg: "#11151c",
    altBg: "#1b2430",
    cardBg: "rgba(255,255,255,0.06)",
    coverGradient: "linear-gradient(180deg, #1b2430 0%, #11151c 100%)",
    text: "#ffffff",
    primary: "#ffffff",
    muted: "rgba(255,255,255,0.55)",
    accent: "#a8455f",
    border: "rgba(168,69,95,0.35)",
    btnBg: "#a8455f",
    btnText: "#ffffff",
    musicBg: "rgba(0,0,0,0.50)",
    musicColor: "#a8455f",
  },
};
