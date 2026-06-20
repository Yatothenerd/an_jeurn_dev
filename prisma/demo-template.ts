import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { shortToken } from "../lib/utils/token";

// Creates a published demo invitation using the Royalty-tier "Immersive" theme,
// with existing public images as per-section backgrounds so it renders fully.
// Run: npx tsx prisma/demo-template.ts  → visit /invite/royalty-immersive-demo

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SLUG = "royalty-immersive-demo";

async function main() {
  const client = await prisma.user.findUnique({ where: { email: "client@anjeurn.com" } });
  if (!client) throw new Error("Demo client not found — run `npm run db:seed` first.");

  const event = await prisma.event.upsert({
    where: { slug: SLUG },
    update: { title: "Sophea & Dara", venueName: "Sofitel Phnom Penh", venueMapUrl: "https://maps.google.com/?q=Sofitel+Phnom+Penh" },
    create: {
      userId: client.id,
      title: "Sophea & Dara",
      eventType: "Wedding",
      eventDate: new Date("2026-12-12T16:00:00"),
      venueName: "Sofitel Phnom Penh",
      venueMapUrl: "https://maps.google.com/?q=Sofitel+Phnom+Penh",
      slug: SLUG,
      status: "published",
    },
  });

  // Rebuild the invitation cleanly (cascades sections/photos/wishes).
  await prisma.invitation.deleteMany({ where: { eventId: event.id } });

  await prisma.invitation.create({
    data: {
      eventId: event.id,
      themeId: "theme-royal-khmer",
      isPublished: true,
      showWatermark: false,
      shareLink: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/invite/${SLUG}`,
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
              heading: "Sophea & Dara",
              subheading: "Together with their families",
              guestLabel: "Honoured Guest",
              bgUrl: "/themes/khmer/cover.jpg",
            },
          },
          { type: "countdown", sortOrder: 1, content: { targetDate: "2026-12-12T16:00:00", label: "Counting Down" } },
          {
            type: "details",
            sortOrder: 2,
            content: {
              title: "Event Details",
              bgUrl: "/themes/khmer/venue.png",
              items: [
                { icon: "📅", label: "Date", value: "Saturday, 12 December 2026" },
                { icon: "⏰", label: "Time", value: "4:00 PM" },
                { icon: "📍", label: "Venue", value: "Sofitel Phnom Penh" },
              ],
            },
          },
          {
            type: "agenda",
            sortOrder: 3,
            content: {
              title: "Order of Ceremony",
              subtitle: "Agenda",
              bgUrl: "/themes/khmer/g2.jpg",
              items: [
                { time: "4:00 PM", title: "Welcome & Reception" },
                { time: "5:00 PM", title: "Wedding Ceremony" },
                { time: "6:30 PM", title: "Dinner & Celebration" },
              ],
            },
          },
          { type: "gallery", sortOrder: 4, content: { title: "Our Moments", layout: "grid", bgUrl: "/themes/khmer/g3.jpg" } },
          {
            type: "khqr",
            sortOrder: 5,
            content: { title: "Gift", recipientName: "Sophea & Dara", currency: "USD", qrImageUrl: "/themes/khmer/qr.png" },
          },
          {
            type: "wishing",
            sortOrder: 6,
            content: { title: "Wishing Wall", placeholder: "Leave your wishes for the couple…", bgUrl: "/themes/khmer/cover.jpg" },
          },
        ],
      },
    },
  });

  // A sample guest so you can preview the personalized cover greeting.
  const token = shortToken();
  await prisma.guest.deleteMany({ where: { eventId: event.id } });
  await prisma.guest.create({ data: { eventId: event.id, name: "Lina Sok", token } });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  console.log("✅ Demo template ready (theme: Immersive / Royalty)");
  console.log("   Public:        " + base + "/invite/" + SLUG);
  console.log("   Personalized:  " + base + "/invite/" + SLUG + "?g=" + token);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
