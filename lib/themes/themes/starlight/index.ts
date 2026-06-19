import type { ThemeModule } from "../../types";
import { STARLIGHT_CSS } from "./theme.css";
import { starlightLayout } from "./layout";
import { StarlightCover } from "./sections";

// Animated theme example: bespoke twinkling cover + scroll-reveal layout, while
// reusing every standard section renderer for its content.
export const starlight: ThemeModule = {
  id: "theme-starlight",
  name: "Starlight",
  css: STARLIGHT_CSS,
  layout: starlightLayout,
  sections: {
    cover: StarlightCover,
  },
  tokens: {
    id: "theme-starlight",
    font: "'Cormorant Garamond', Georgia, serif",
    family: "custom",
    bg: "#0a0e1a",
    altBg: "#11162a",
    cardBg: "#161d33",
    coverGradient: "radial-gradient(circle at 50% 28%, #1b2547 0%, #0a0e1a 72%)",
    primary: "#f5f3ff",
    accent: "#c9b06a",
    text: "#e8e9f2",
    muted: "#9aa0b8",
    border: "rgba(201,176,106,0.25)",
    btnBg: "#c9b06a",
    btnText: "#0a0e1a",
    musicBg: "#161d33",
    musicColor: "#c9b06a",
    gem: "✦",
    cornerStyle: "line",
    decoBand: null,
  },
};
