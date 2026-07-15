import type { ThemeModule } from "../../types";
import { ROYAL_TICKET_CSS } from "./theme.css";
import { royalTicketLayout } from "./layout";
import {
  RtCover,
  RtWording,
  RtCountdown,
  RtAgenda,
  RtDetails,
  RtGallery,
  RtKhqr,
  RtWishing,
  RtGateDecoration,
} from "./sections";

// Royal Ticket — a deep-navy boarding-pass / passport travel theme (notched
// ticket-stub cards, gold dashed perforation, plane + globe glyphs, passport
// stamps; photos are color by default with an opt-in black & white toggle).
// All content is DB-driven: sections read Section.content / Event / Photo /
// Wish data.
export const royalTicket: ThemeModule = {
  id: "theme-royal-ticket",
  name: "Royal Ticket",
  preset: true, // design locked — only content is editable

  css: ROYAL_TICKET_CSS,
  fonts: ["Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600", "Kantumruy+Pro:wght@300;400;500;600;700"],
  layout: royalTicketLayout,
  gateDecoration: RtGateDecoration,
  sections: {
    cover: RtCover,
    wording: RtWording,
    countdown: RtCountdown,
    agenda: RtAgenda,
    details: RtDetails,
    gallery: RtGallery,
    khqr: RtKhqr,
    wishing: RtWishing,
  },
  tokens: {
    id: "theme-royal-ticket",
    font: "'Kantumruy Pro', 'Nunito', sans-serif",
    headingFont: "'Cormorant Garamond', 'Playfair Display', serif",
    family: "custom",
    bg: "#12213f",
    altBg: "#16264a",
    cardBg: "#ffffff",
    coverGradient: "linear-gradient(180deg, #0d1730 0%, #16264a 100%)",
    primary: "#12213f",
    accent: "#c8a15c",
    text: "#f2ecdc",
    muted: "#8b93a8",
    title: "#f2ecdc",
    subtitle: "#8b93a8",
    header: "#c8a15c",
    body: "#f2ecdc",
    border: "rgba(200, 161, 92, 0.3)",
    btnBg: "#c8a15c",
    btnText: "#12213f",
    musicBg: "#12213f",
    musicColor: "#c8a15c",
    gem: "✈",
    cornerStyle: "line",
    decoBand: null,
  },
};
