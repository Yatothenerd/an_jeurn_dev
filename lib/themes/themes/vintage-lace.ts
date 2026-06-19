import type { ThemeModule } from "../types";

export const vintageLace: ThemeModule = {
  id: "theme-vintage-lace",
  name: "Vintage Lace",
  tokens: {
    id: "theme-vintage-lace",
    font: "'Cormorant Garamond', Georgia, serif",
    family: "standard",
    bg: "#34251B",
    altBg: "#2E2018",
    cardBg: "#3C2A1E",
    coverGradient: "linear-gradient(170deg,#3A2A20 35%,#241910)",
    primary: "#F3E9D6",
    accent: "#C9A86A",
    text: "#F0E6D2",
    muted: "#B89C7A",
    border: "rgba(201,168,106,0.25)",
    btnBg: "#C9A86A",
    btnText: "#2A1E16",
    musicBg: "#C9A86A",
    musicColor: "#2A1E16",
    gem: "❧",
    cornerStyle: "line",
    decoBand: { pattern: "floral", blend: "screen" },
  },
};
