import type { ThemeModule } from "../../types";
import { SAND_BEACH_CSS } from "./theme.css";
import { sandBeachLayout } from "./layout";
import {
  SbCover,
  SbWording,
  SbCountdown,
  SbAgenda,
  SbDetails,
  SbGallery,
  SbKhqr,
  SbWishing,
  SbGateDecoration,
} from "./sections";

// Sand Beach — a dusty-blue & warm-sand seaside theme (scalloped lace cards,
// a satin ribbon bow, tilted polaroids, a hearted month calendar with a
// digital counter, pearl dress-code swatches). All content is DB-driven:
// sections read Section.content / Event / Photo / Wish data.
export const sandBeach: ThemeModule = {
  id: "theme-sand-beach",
  name: "Sand Beach",
  preset: true, // design locked — only content is editable

  css: SAND_BEACH_CSS,
  fonts: ["Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600", "Kantumruy+Pro:wght@300;400;500;600;700"],
  layout: sandBeachLayout,
  gateDecoration: SbGateDecoration,
  sections: {
    cover: SbCover,
    wording: SbWording,
    countdown: SbCountdown,
    agenda: SbAgenda,
    details: SbDetails,
    gallery: SbGallery,
    khqr: SbKhqr,
    wishing: SbWishing,
  },
  tokens: {
    id: "theme-sand-beach",
    font: "'Kantumruy Pro', 'Nunito', sans-serif",
    headingFont: "'Cormorant Garamond', 'Playfair Display', serif",
    family: "custom",
    bg: "#eef3f8",
    altBg: "#f4ede0",
    cardBg: "#fdfaf3",
    coverGradient: "linear-gradient(180deg, #dce8f4 0%, #eef3f8 100%)",
    primary: "#5b83ab",
    accent: "#d88a95",
    text: "#3c5a78",
    muted: "#9aa9b8",
    title: "#3c5a78",
    subtitle: "#9aa9b8",
    header: "#5b83ab",
    body: "#3c5a78",
    border: "rgba(91, 131, 171, 0.25)",
    btnBg: "#5b83ab",
    btnText: "#ffffff",
    musicBg: "#5b83ab",
    musicColor: "#ffffff",
    gem: "✧",
    cornerStyle: "line",
    decoBand: null,
  },
};
