import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { shortToken } from "../lib/utils/token";

// Default dummy data for previewing ANY theme when no real event data exists.
// Creates (or rebuilds) a published demo event whose invitation carries every
// section type, photos, a sample guest and wishes — so a freshly built theme
// always has content to render.
//
// Run:  npx tsx prisma/demo-data.ts [themeId] [slug]
//   npx tsx prisma/demo-data.ts                              → Sweet Hearts at /invite/theme-demo
//   npx tsx prisma/demo-data.ts theme-royal-khmer khmer-demo → Royal Khmer at /invite/khmer-demo

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const THEME_ID = process.argv[2] ?? "theme-sweet-hearts";
const SLUG = process.argv[3] ?? "theme-demo";

async function ensureDemoClient() {
  let client = await prisma.user.findUnique({ where: { email: "client@anjeurn.com" } });
  if (!client) {
    client = await prisma.user.create({
      data: {
        name: "Demo Client",
        email: "client@anjeurn.com",
        passwordHash: await bcrypt.hash("Client@123", 12),
        role: "client",
      },
    });
  }

  // The demo needs a package with every feature enabled so all sections render.
  let pkg = await prisma.package.findFirst({
    where: { hasWishing: true, hasKhqr: true, hasMusic: true, hasLocation: true },
    orderBy: { priceUsd: "desc" },
  });
  if (!pkg) {
    pkg = await prisma.package.upsert({
      where: { slug: "demo-full" },
      update: {},
      create: {
        name: "Demo Full",
        slug: "demo-full",
        priceUsd: 0,
        maxSections: 20,
        maxPhotos: 50,
        maxGuests: 500,
        hasMusic: true,
        hasVideo: true,
        hasKhqr: true,
        hasWishing: true,
        hasHosting: true,
        hasCustomThumb: true,
        hasLocation: true,
        hasOpeningCover: true,
        hasWatermark: false,
        hasGuestControl: true,
        guestControlType: "full",
        hasLogo: true,
        galleryType: "premium",
      },
    });
  }

  const grant = await prisma.userPackage.findFirst({ where: { userId: client.id, status: "active" } });
  if (!grant) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    await prisma.userPackage.create({
      data: { userId: client.id, packageId: pkg.id, createdBy: admin?.id ?? client.id, status: "active" },
    });
  }
  return client;
}

async function main() {
  const client = await ensureDemoClient();

  // Event date matches the reference design: mid-August, afternoon start.
  const eventDate = new Date("2026-08-16T15:30:00");

  const event = await prisma.event.upsert({
    where: { slug: SLUG },
    update: {
      title: "Artem & Vika",
      eventDate,
      venueName: "Admiral — Tent on the Water",
      venueMapUrl: "https://maps.google.com/?q=Admiral+Tent+on+the+Water",
    },
    create: {
      userId: client.id,
      title: "Artem & Vika",
      eventType: "Wedding",
      eventDate,
      venueName: "Admiral — Tent on the Water",
      venueMapUrl: "https://maps.google.com/?q=Admiral+Tent+on+the+Water",
      slug: SLUG,
      status: "published",
    },
  });

  // Rebuild the invitation cleanly (cascades sections/photos/wishes).
  await prisma.invitation.deleteMany({ where: { eventId: event.id } });

  await prisma.invitation.create({
    data: {
      eventId: event.id,
      contentType: "photo",
      isPublished: true,
      showWatermark: false,
      shareLink: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/invite/${SLUG}`,
      coverUrl: "/themes/khmer/cover.jpg",
      overlayConfig: {
        themeId: THEME_ID,
        showRsvp: true,
        showGuestName: true,
        keepCoverAfterOpen: true,
      },
      photos: {
        create: [
          { url: "/themes/khmer/g1.jpg", sortOrder: 0 },
          { url: "/themes/khmer/g2.jpg", sortOrder: 1 },
          { url: "/themes/khmer/g3.jpg", sortOrder: 2 },
          { url: "/themes/khmer/cover.jpg", sortOrder: 3 },
        ],
      },
      sections: {
        create: [
          {
            type: "cover",
            sortOrder: 0,
            content: {
              heading: "Artem + Vika",
              subheading: "We invite you\nto our",
              bigWord: "wedding",
              guestLabel: "Dear",
              imageUrl: "/themes/khmer/cover.jpg",
            },
          },
          {
            type: "wording",
            sortOrder: 1,
            content: {
              title: "Guess who?",
              text: "Time has flown by, and these two sweet kids are getting married!\nYes — we're just as shocked as you are!",
              imageUrl: "/themes/khmer/g1.jpg",
            },
          },
          {
            type: "wording",
            sortOrder: 2,
            content: {
              title: "We love you so much!",
              text: "That's why we invite you to witness the birthday of our family.\nWe can't wait to see you!",
            },
          },
          { type: "countdown", sortOrder: 3, content: { targetDate: "2026-08-16T15:30:00", label: "When?" } },
          {
            type: "details",
            sortOrder: 4,
            content: {
              title: "Where?",
              items: [
                { icon: "📍", label: "Address", value: "Lesnoy Lane 4, Borovsky Village" },
                { icon: "⛺", label: "Venue", value: "Admiral — Tent on the Water" },
              ],
              imageUrl: "/themes/khmer/venue.png",
              mapLabel: "open map",
              dresscodeLabel: "Dress code",
              dresscodeText:
                "You matter to us most! But we'd be happy if you support the style and colors of our wedding in your outfits.",
              dresscode: ["#f6a5c1", "#e75480", "#9e2b2b", "#b7b7b7", "#3a3a3a"],
              notesLabel: "Details",
              notes: [
                "Please don't give us fresh flowers — we won't have time to enjoy their beauty before we leave.",
                "Instead of flowers, you can gift us a bottle of wine with a note about the occasion to open it.",
              ],
            },
          },
          {
            type: "agenda",
            sortOrder: 5,
            content: {
              title: "What time?",
              items: [
                { time: "15:30", title: "Guests gathering & welcome drinks" },
                { time: "16:00", title: "Wedding ceremony" },
                { time: "17:00", title: "Banquet & gastronomic delights" },
                { time: "23:00", title: "Farewell to the newlyweds" },
              ],
            },
          },
          { type: "gallery", sortOrder: 6, content: { title: "Our moments", layout: "grid" } },
          {
            type: "khqr",
            sortOrder: 7,
            content: { title: "A gift from the heart", recipientName: "Artem & Vika", currency: "USD", qrImageUrl: "/themes/khmer/qr.png" },
          },
          {
            type: "wishing",
            sortOrder: 8,
            content: { title: "Wishing wall", placeholder: "Your warmest wishes…" },
          },
        ],
      },
      wishes: {
        create: [
          { guestName: "Lina Sok", message: "So happy for you both — see you on the dance floor!" },
          { guestName: "Dara Chan", message: "Wishing you a lifetime of love and laughter ❤" },
        ],
      },
    },
  });

  // A sample guest so the personalized greeting can be previewed.
  const token = shortToken();
  await prisma.guest.deleteMany({ where: { eventId: event.id } });
  await prisma.guest.create({ data: { eventId: event.id, name: "Lina Sok", token } });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  console.log(`✅ Demo data ready (theme: ${THEME_ID})`);
  console.log("   Public:        " + base + "/invite/" + SLUG);
  console.log("   Personalized:  " + base + "/invite/" + SLUG + "?g=" + token);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
