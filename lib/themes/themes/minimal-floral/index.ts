import type { ThemeModule } from "../../types";
import { MF_CSS } from "./theme.css";
import { mfLayout } from "./layout";
import {
  MfCover,
  MfWording,
  MfCountdown,
  MfAgenda,
  MfDetails,
  MfGallery,
  MfKhqr,
  MfWishing,
  MfGateDecoration,
} from "./sections";

// Minimal Floral — cream & taupe wedding theme with hand-drawn line-art
// blossoms, a hand-circled save-the-date calendar, and a floral-beaded
// timeline. All content is DB-driven: sections read Section.content /
// Event / Photo / Wish data, same as every other bespoke theme.
export const minimalFloral: ThemeModule = {
  id: "theme-minimal-floral",
  name: "Minimal Floral",
  preset: true, // design locked — only content is editable

  css: MF_CSS,
  fonts: ["Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500;1,600", "Jost:wght@400;500;600"],
  layout: mfLayout,
  gateDecoration: MfGateDecoration,
  sections: {
    cover: MfCover,
    wording: MfWording,
    countdown: MfCountdown,
    agenda: MfAgenda,
    details: MfDetails,
    gallery: MfGallery,
    khqr: MfKhqr,
    wishing: MfWishing,
  },
  tokens: {
    id: "theme-minimal-floral",
    font: "'Cormorant Garamond', 'Kantumruy Pro', serif",
    headingFont: "'Cormorant Garamond', serif",
    headerFont: "'Jost', sans-serif",
    family: "custom",
    bg: "#faf6ee",
    altBg: "#faf6ee",
    cardBg: "#fffdf9",
    coverGradient: "linear-gradient(180deg, #faf6ee 0%, #f1e9da 100%)",
    primary: "#7c6142",
    accent: "#9c7b4f",
    text: "#6b5c47",
    muted: "#a5937a",
    title: "#5b4630",
    subtitle: "#8a765c",
    header: "#8a6d47",
    body: "#6b5c47",
    titleAlign: "center",
    bodyAlign: "center",
    border: "rgba(139, 109, 71, 0.22)",
    btnBg: "#5b4630",
    btnText: "#faf6ee",
    musicBg: "#5b4630",
    musicColor: "#faf6ee",
    gem: "❀",
    cornerStyle: "line",
    decoBand: null,
  },
};
