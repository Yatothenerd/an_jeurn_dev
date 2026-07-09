import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// One-off script: creates the "Lovely Book" Template (a Freeform/Builder
// design preset) — a cream & wine-red romantic "storybook love letter" style,
// modeled on https://bdinvite.godyato.com/ (palette + fonts extracted from its
// compiled CSS: brand-cream #faf5eb/#543e2c/#38281a, brand-wine #8c1d2f family,
// brand-pink #ffe4e8/#ffcad3/#ff6680; fonts Kantumruy Pro, Cormorant Garamond,
// Alex Brush).
//
// Run: npx tsx prisma/create-lovely-book-template.ts

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CREAM_50 = "#faf5eb";
const CREAM_800 = "#543e2c";
const CREAM_900 = "#38281a";
const WINE_400 = "#c95c6e";
const WINE_500 = "#8c1d2f";
const WINE_600 = "#731221";
const WINE_800 = "#4b0c15";
const PINK_100 = "#ffe4e8";
const PINK_200 = "#ffcad3";

const SANS = "'Kantumruy Pro', 'Nunito', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const CURSIVE = "'Alex Brush', cursive";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function mkSection(kind: string, name: string, extra: Record<string, unknown> = {}) {
  return {
    id: uid(), name, kind, visible: true, showTitle: true, mode: "text",
    blocks: [{ id: uid(), text: "", font: SERIF, color: PINK_100 }],
    columns: 1, imageUrl: "", imageScalePct: 100, agenda: [],
    gallery: [], aba: { qrUrl: "", name: "", note: "" }, map: { url: "", imageUrl: "" },
    wishing: { placeholder: "Leave us a lovely wish…" },
    countdown: { showDays: true, showHours: true, showMinutes: true },
    anim: "fade", ...extra,
  };
}

function mkGuide(label: string) {
  return {
    enabled: false,
    interaction: "click",
    blocks: [{ id: uid(), text: label, font: SANS, color: PINK_100, xPct: 50, yPct: 56 }],
    hand: { value: "👆", isImage: false, xPct: 50, yPct: 72, anim: "tap" },
  };
}

const builderDraft = {
  eventName: "",
  eventType: "Wedding",
  dateTime: "",
  langs: { khmer: true, english: true },
  coverBlocks: [
    { id: uid(), text: "You are lovingly invited", font: SANS, color: WINE_600, size: 14, pos: { xPct: 50, yPct: 26 } },
    { id: uid(), text: "Sophea & Dara", font: CURSIVE, color: WINE_600, size: 56, pos: { xPct: 50, yPct: 42 } },
    { id: uid(), text: "A lovely new chapter begins", font: SERIF, color: CREAM_900, size: 16, pos: { xPct: 50, yPct: 57 } },
  ],
  openBtnPos: { xPct: 50, yPct: 87 },
  anim: "envelope",
  keepCover: true,
  showOpenBtn: true,
  openBtnColor: WINE_600,
  openBtnStroke: WINE_400,
  openBtnFill: PINK_100,
  openBtnFont: SANS,
  openBtnSize: 13,
  openBtnText: "Open the Letter",
  openOnScroll: false,
  coverBg: { kind: "color", imageUrl: "", videoUrl: "", color: `linear-gradient(160deg, ${CREAM_50} 0%, ${PINK_100} 100%)`, blur: 0, opacity: 0.4, overlayColor: "#000000", autoplay: true, lockUntilEnd: false },
  contentBg: { kind: "color", imageUrl: "", videoUrl: "", color: `linear-gradient(180deg, ${WINE_600} 0%, ${WINE_800} 100%)`, blur: 0, opacity: 0.4, overlayColor: "#000000", autoplay: true, lockUntilEnd: false },
  coverGuide: mkGuide("Tap to open the letter"),
  contentGuide: mkGuide("Scroll to read on"),
  monogram: { url: "", scalePct: 22, pos: { xPct: 50, yPct: 16 }, showCover: false, showContent: false },
  guestName: { enabled: true, text: "Dear Guest", font: SERIF, color: WINE_500, size: 18, pos: { xPct: 50, yPct: 71 } },
  sections: [
    mkSection("wording", "Our Story", { blocks: [{ id: uid(), text: "Together with our families,\nwe joyfully turn this new page\nand warmly invite you to be part of our story.", font: SERIF, color: PINK_100 }] }),
    mkSection("countdown", "Counting Down the Days", { anim: "slideUp" }),
    mkSection("agenda", "The Celebration", { anim: "slideUp", agenda: [
      { id: uid(), icon: "💒", showIcon: true, time: "10:00 AM", name: "Ceremony" },
      { id: uid(), icon: "🍽", showIcon: true, time: "12:00 PM", name: "Reception" },
    ] }),
    mkSection("memory", "Sweet Memories", { imageScalePct: 48 }),
    mkSection("aba", "A Small Gift", { aba: { qrUrl: "", name: "", note: "Your presence is our greatest gift." } }),
    mkSection("map", "Find Us"),
    mkSection("wishing", "Leave a Wish"),
    mkSection("rsvp", "Kindly RSVP"),
  ],
  music: { url: "", playAfterVideoEnd: false, playOnLoad: false, playOnScroll: true },
  overlayButtons: { playPause: true, map: true, wishGift: true, scrollBack: true, layout: "float" },
  outerBg: { kind: "color", imageUrl: "", videoUrl: "", color: WINE_800, blur: 0, opacity: 0.4, overlayColor: "#000000", autoplay: true, lockUntilEnd: false },
};

async function main() {
  const overlayConfig = { themeId: "theme-freeform", builderDraft };

  const existing = await prisma.template.findFirst({ where: { name: "Lovely Book" } });
  const template = existing
    ? await prisma.template.update({ where: { id: existing.id }, data: { overlayConfig, contentType: "text", isActive: true } })
    : await prisma.template.create({ data: { name: "Lovely Book", overlayConfig, contentType: "text", isActive: true, sortOrder: 0 } });

  // Tag it to every existing package so it's immediately usable.
  const packages = await prisma.package.findMany({ select: { id: true } });
  if (packages.length > 0) {
    await prisma.packageTemplate.deleteMany({ where: { templateId: template.id } });
    await prisma.packageTemplate.createMany({
      data: packages.map((p) => ({ packageId: p.id, templateId: template.id })),
      skipDuplicates: true,
    });
  }

  console.log(`Template "${template.name}" ready → id=${template.id}`);
  console.log(`Edit at /admin/themes/${template.id}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
