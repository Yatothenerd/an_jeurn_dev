import type { ThemeModule } from "../../types";
import { KHMER_CSS } from "./theme.css";
import { khmerLayout } from "./layout";
import {
  KhmerCover,
  KhmerCountdown,
  KhmerAgenda,
  KhmerDetails,
  KhmerGallery,
  KhmerVideo,
  KhmerKhqr,
  KhmerWishing,
} from "./sections";

export const royalKhmer: ThemeModule = {
  id: "theme-royal-khmer",
  name: "Red Royal Khmer",
  css: KHMER_CSS,
  fonts: ["Koulen", "Moulpali", "Kantumruy+Pro:wght@300;400;500;600"],
  layout: khmerLayout,
  sections: {
    cover: KhmerCover,
    countdown: KhmerCountdown,
    agenda: KhmerAgenda,
    details: KhmerDetails,
    gallery: KhmerGallery,
    video: KhmerVideo,
    khqr: KhmerKhqr,
    wishing: KhmerWishing,
  },
  tokens: {
    id: "theme-royal-khmer",
    font: "'Kantumruy Pro', sans-serif",
    family: "khmer",
    bg: "#f9f7f4",
    altBg: "#800020",
    cardBg: "#ffffff",
    coverGradient: "radial-gradient(circle at 50% 16%, #800020 58%, #5a0016 100%)",
    primary: "#b76e79",
    accent: "#d4af37",
    text: "#4a3728",
    muted: "#8a7560",
    border: "rgba(212,175,55,0.25)",
    btnBg: "#800020",
    btnText: "#f9f7f4",
    musicBg: "#5a0016",
    musicColor: "#d4af37",
    gem: "♦",
    cornerStyle: "damask",
    decoBand: null,
  },
};
