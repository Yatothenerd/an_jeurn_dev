import type { ThemeModule } from "../../types";
import { CINEMATIC_CSS } from "./theme.css";
import { CinematicCover } from "./sections";

// Video theme example: a video-background cover (drop cover.mp4 + cover.jpg into
// public/themes/cinematic/), reusing the standard layout + sections elsewhere.
export const cinematic: ThemeModule = {
  id: "theme-cinematic",
  name: "Cinematic",
  css: CINEMATIC_CSS,
  assets: {
    video: "/themes/cinematic/cover.mp4",
    poster: "/themes/cinematic/cover.jpg",
  },
  sections: {
    cover: CinematicCover,
  },
  tokens: {
    id: "theme-cinematic",
    font: "'Cormorant Garamond', Georgia, serif",
    family: "custom",
    bg: "#0c0c0e",
    altBg: "#141417",
    cardBg: "#17171b",
    coverGradient: "linear-gradient(160deg,#1a1a20,#000)",
    primary: "#f5e6c8",
    accent: "#cfa75f",
    text: "#ece9e2",
    muted: "#9a9488",
    border: "rgba(207,167,95,0.25)",
    btnBg: "#cfa75f",
    btnText: "#0c0c0e",
    musicBg: "#17171b",
    musicColor: "#cfa75f",
    gem: "❖",
    cornerStyle: "line",
    decoBand: null,
  },
};
