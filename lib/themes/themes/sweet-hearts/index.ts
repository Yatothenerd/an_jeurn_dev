import type { ThemeModule } from "../../types";
import { SWEET_CSS } from "./theme.css";
import { sweetLayout } from "./layout";
import {
  ShCover,
  ShWording,
  ShCountdown,
  ShAgenda,
  ShDetails,
  ShGallery,
  ShKhqr,
  ShWishing,
} from "./sections";

// Sweet Hearts — hand-drawn pink & cream wedding theme (doodle hearts,
// polaroids, circled calendar day, squiggly timeline). All content is
// DB-driven: sections read Section.content / Event / Photo / Wish data.
export const sweetHearts: ThemeModule = {
  id: "theme-sweet-hearts",
  name: "Sweet Hearts",
  preset: true, // design locked — only content is editable

  css: SWEET_CSS,
  fonts: ["Caveat:wght@400;500;600;700", "Kantumruy+Pro:wght@300;400;500;600"],
  layout: sweetLayout,
  sections: {
    cover: ShCover,
    wording: ShWording,
    countdown: ShCountdown,
    agenda: ShAgenda,
    details: ShDetails,
    gallery: ShGallery,
    khqr: ShKhqr,
    wishing: ShWishing,
  },
  tokens: {
    id: "theme-sweet-hearts",
    font: "'Caveat', 'Kantumruy Pro', cursive",
    headingFont: "'Caveat', 'Kantumruy Pro', cursive",
    family: "custom",
    bg: "#fdf9f1",
    altBg: "#fdf9f1",
    cardBg: "#fffdf8",
    coverGradient: "linear-gradient(180deg, #f7a8c4 0%, #ee86ae 100%)",
    primary: "#d64545",
    accent: "#e8788f",
    text: "#6f4c4c",
    muted: "#a98080",
    title: "#d64545",
    subtitle: "#8a5a5a",
    header: "#d64545",
    body: "#6f4c4c",
    border: "rgba(214, 69, 69, 0.35)",
    btnBg: "#d64545",
    btnText: "#fff8f4",
    musicBg: "#d64545",
    musicColor: "#fff8f4",
    gem: "♥",
    cornerStyle: "line",
    decoBand: null,
  },
};
