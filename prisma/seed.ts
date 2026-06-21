import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Admin user
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@anjeurn.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@anjeurn.com",
      passwordHash: adminPassword,
      role: "admin",
    },
  });
  console.log("Created admin:", admin.email);

  // Packages — feature flags + limits. Idempotent (create AND update).
  const savingData = {
    name: "Saving",
    priceUsd: 50,
    maxSections: 4,
    maxPhotos: 4,
    maxGuests: 50,
    hasMusic: false,
    hasVideo: false,
    hasKhqr: false,
    hasWishing: false,
    hasHosting: true,
    hasCustomThumb: false,
    hasLocation: false,
    hasOpeningCover: false,
    hasWatermark: true,
    hasGuestControl: false,
    guestControlType: "none" as const,
    guestEditLimit: null,
    hasLogo: false,
    galleryType: "basic",
  };
  const standardData = {
    name: "Standard",
    priceUsd: 100,
    maxSections: 6,
    maxPhotos: 20,
    maxGuests: 100,
    hasMusic: true,
    hasVideo: false,
    hasKhqr: true,
    hasWishing: true,
    hasHosting: true,
    hasCustomThumb: false,
    hasLocation: true,
    hasOpeningCover: false,
    hasWatermark: true,
    hasGuestControl: true,
    guestControlType: "limited" as const,
    guestEditLimit: 3,
    hasLogo: false,
    galleryType: "standard",
  };
  const premiereData = {
    name: "Premiere",
    priceUsd: 190,
    maxSections: 10,
    maxPhotos: 40,
    maxGuests: 300,
    hasMusic: true,
    hasVideo: true,
    hasKhqr: true,
    hasWishing: true,
    hasHosting: true,
    hasCustomThumb: true,
    hasLocation: true,
    hasOpeningCover: false,
    hasWatermark: false,
    hasGuestControl: true,
    guestControlType: "full" as const,
    guestEditLimit: null,
    hasLogo: true,
    galleryType: "standard",
  };
  const royaltyData = {
    name: "Royalty",
    priceUsd: 280,
    maxSections: 20,
    maxPhotos: 100,
    maxGuests: 1000,
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
    guestControlType: "full" as const,
    guestEditLimit: null,
    hasLogo: true,
    galleryType: "premium",
  };

  await prisma.package.upsert({ where: { slug: "saving" },    update: savingData,   create: { ...savingData,   slug: "saving" } });
  await prisma.package.upsert({ where: { slug: "package-a" }, update: standardData, create: { ...standardData, slug: "package-a" } });
  const packageB = await prisma.package.upsert({ where: { slug: "package-b" }, update: premiereData, create: { ...premiereData, slug: "package-b" } });
  const packageC = await prisma.package.upsert({ where: { slug: "package-c" }, update: royaltyData, create: { ...royaltyData, slug: "package-c" } });
  console.log("Created packages: Saving, Standard, Premiere, Royalty");

  // Demo client with an active Package C — for testing the dashboard.
  const clientPassword = await bcrypt.hash("Client@123", 12);
  const client = await prisma.user.upsert({
    where: { email: "client@anjeurn.com" },
    update: {},
    create: {
      name: "Demo Client",
      email: "client@anjeurn.com",
      passwordHash: clientPassword,
      role: "client",
    },
  });
  const existingGrant = await prisma.userPackage.findFirst({
    where: { userId: client.id, status: "active" },
  });
  if (!existingGrant) {
    await prisma.userPackage.create({
      data: { userId: client.id, packageId: packageC.id, createdBy: admin.id, status: "active" },
    });
  }
  console.log("Created demo client:", client.email, "(Package C)");

  // Demo event + invitation (published, no design — admin configures via EventWizard)
  const demoSlug = "sophea-dara-wedding";
  const demoEvent = await prisma.event.upsert({
    where: { slug: demoSlug },
    update: { title: "Sophea & Dara's Wedding" },
    create: {
      userId: client.id,
      title: "Sophea & Dara's Wedding",
      eventType: "Wedding",
      eventDate: new Date("2026-12-12T16:00:00"),
      venueName: "Sofitel Phnom Penh",
      venueMapUrl: "https://maps.google.com/?q=Sofitel+Phnom+Penh",
      slug: demoSlug,
      status: "published",
    },
  });
  const demoInvExisting = await prisma.invitation.findUnique({ where: { eventId: demoEvent.id } });
  if (!demoInvExisting) {
    await prisma.invitation.create({
      data: {
        eventId: demoEvent.id,
        shareLink: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/invite/${demoSlug}`,
        contentType: "photo",
        isPublished: true,
        showWatermark: false,
      },
    });
  }
  console.log("Demo event ready:", demoSlug);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
