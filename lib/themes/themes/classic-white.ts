import type { ThemeModule } from "../types";

export const classicWhite: ThemeModule = {
  id: "theme-classic-white",
  name: "Classic White",
  tokens: {
    id: "theme-classic-white",
    font: "'Cormorant Garamond', Georgia, serif",
    family: "standard",
    bg: "#FAF8F2",
    altBg: "#F0EBE0",
    cardBg: "#FBFAF6",
    coverGradient: "linear-gradient(170deg,#FAF8F2 60%,#EDE5D5)",
    primary: "#1a1a1a",
    accent: "#B8943F",
    text: "#1a1a1a",
    muted: "#6B5B3E",
    border: "rgba(184,148,63,0.22)",
    btnBg: "#1a1a1a",
    btnText: "#FAF8F2",
    musicBg: "#1a1a1a",
    musicColor: "#FAF8F2",
    gem: "◆",
    cornerStyle: "line",
    decoBand: null,
  },
};
