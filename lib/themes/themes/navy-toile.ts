import type { ThemeModule } from "../types";

export const navyToile: ThemeModule = {
  id: "theme-navy-toile",
  name: "Navy Toile",
  tokens: {
    id: "theme-navy-toile",
    font: "'Playfair Display', Georgia, serif",
    family: "standard",
    bg: "#F5F1E8",
    altBg: "#ECE5D6",
    cardBg: "#F7F3EB",
    coverGradient: "linear-gradient(170deg,#F7F3EB 50%,#D8E0EC)",
    primary: "#1F3A5F",
    accent: "#2C4A6E",
    text: "#1A2A40",
    muted: "#5A6B82",
    border: "rgba(31,58,95,0.2)",
    btnBg: "#1F3A5F",
    btnText: "#F5F1E8",
    musicBg: "#1F3A5F",
    musicColor: "#ffffff",
    gem: "❖",
    cornerStyle: "line",
    decoBand: { pattern: "lace", blend: "mul" },
  },
};
