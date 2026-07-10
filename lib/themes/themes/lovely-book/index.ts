import type { ThemeModule } from "../../types";
import { LOVELY_CSS } from "./theme.css";
import { lovelyLayout } from "./layout";
import {
  LbCover,
  LbWording,
  LbCountdown,
  LbAgenda,
  LbDetails,
  LbGallery,
  LbKhqr,
  LbWishing,
  LbGateDecoration,
} from "./sections";

// Lovely Book — a cream & burgundy "storybook letter" theme (gold-trimmed
// cards, bow & cake motifs, an oval photo frame, a hearted week-strip date,
// a ruled agenda table, scattered polaroids). All content is DB-driven:
// sections read Section.content / Event / Photo / Wish data.
export const lovelyBook: ThemeModule = {
  id: "theme-lovely-book",
  name: "Lovely Book",
  preset: true, // design locked — only content is editable

  css: LOVELY_CSS,
  fonts: ["Moulpali", "Kantumruy+Pro:wght@300;400;500;600;700"],
  layout: lovelyLayout,
  gateDecoration: LbGateDecoration,
  sections: {
    cover: LbCover,
    wording: LbWording,
    countdown: LbCountdown,
    agenda: LbAgenda,
    details: LbDetails,
    gallery: LbGallery,
    khqr: LbKhqr,
    wishing: LbWishing,
  },
  tokens: {
    id: "theme-lovely-book",
    font: "'Kantumruy Pro', 'Nunito', sans-serif",
    headingFont: "'Moulpali', 'Playfair Display', serif",
    family: "custom",
    bg: "#f3ecdc",
    altBg: "#faf3e8",
    cardBg: "#fdf8ee",
    coverGradient: "linear-gradient(180deg, #f7ecd9 0%, #f3e4d0 100%)",
    primary: "#7c1f34",
    accent: "#8c2340",
    text: "#3a332c",
    muted: "#9c8d7f",
    title: "#7c1f34",
    subtitle: "#9c8d7f",
    header: "#7c1f34",
    body: "#3a332c",
    border: "rgba(124, 31, 52, 0.28)",
    btnBg: "#7c1f34",
    btnText: "#fdf8ee",
    musicBg: "#7c1f34",
    musicColor: "#fdf8ee",
    gem: "♥",
    cornerStyle: "line",
    decoBand: null,
  },
};
