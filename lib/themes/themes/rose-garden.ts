import type { ThemeModule } from "../types";

export const roseGarden: ThemeModule = {
  id: "theme-rose-garden",
  name: "Rose Garden",
  tokens: {
    id: "theme-rose-garden",
    font: "'Playfair Display', Georgia, serif",
    family: "standard",
    bg: "#F8E9EC",
    altBg: "#FBEEF0",
    cardBg: "#FFF6F8",
    coverGradient: "linear-gradient(160deg,#FBEFF1 45%,#F2CDD6)",
    primary: "#5A1A2E",
    accent: "#A8455E",
    text: "#3D1320",
    muted: "#8A5566",
    border: "rgba(168,69,94,0.2)",
    btnBg: "#6E1F3A",
    btnText: "#FBEEF0",
    musicBg: "#A8455E",
    musicColor: "#ffffff",
    gem: "❀",
    cornerStyle: "line",
    decoBand: { pattern: "floral", blend: "mul" },
  },
};
