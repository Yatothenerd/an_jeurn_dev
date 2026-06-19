import type { ThemeModule } from "../types";

export const cocoaDoily: ThemeModule = {
  id: "theme-cocoa-doily",
  name: "Cocoa Doily",
  tokens: {
    id: "theme-cocoa-doily",
    font: "'Cormorant Garamond', Georgia, serif",
    family: "standard",
    bg: "#F3EAD6",
    altBg: "#ECE0C8",
    cardBg: "#FBF6EA",
    coverGradient: "linear-gradient(170deg,#FBF6EA 55%,#EADBC0)",
    primary: "#3A2A1E",
    accent: "#8B6F4E",
    text: "#2E2018",
    muted: "#7A6450",
    border: "rgba(58,42,30,0.18)",
    btnBg: "#3A2A1E",
    btnText: "#F3EAD6",
    musicBg: "#3A2A1E",
    musicColor: "#F3EAD6",
    gem: "⚜",
    cornerStyle: "line",
    decoBand: { pattern: "floral", blend: "mul" },
  },
};
