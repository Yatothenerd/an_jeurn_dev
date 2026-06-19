import type { ThemeModule } from "../types";

export const oliveArch: ThemeModule = {
  id: "theme-olive-arch",
  name: "Olive Arch",
  tokens: {
    id: "theme-olive-arch",
    font: "'Cormorant Garamond', Georgia, serif",
    family: "standard",
    bg: "#F1EEE3",
    altBg: "#E6E1D0",
    cardBg: "#F4F1E7",
    coverGradient: "linear-gradient(170deg,#F4F1E7 55%,#DCDCC4)",
    primary: "#404A1C",
    accent: "#6B7A35",
    text: "#2E3416",
    muted: "#6E7458",
    border: "rgba(64,74,28,0.2)",
    btnBg: "#4A5320",
    btnText: "#F1EEE3",
    musicBg: "#4A5320",
    musicColor: "#ffffff",
    gem: "🌿",
    cornerStyle: "line",
    decoBand: { pattern: "lace", blend: "mul" },
  },
};
