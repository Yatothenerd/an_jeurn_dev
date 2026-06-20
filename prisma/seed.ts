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

  // Themes — Royal Khmer is the only / default theme (admin designs on it).
  const themeRoyalKhmer = await prisma.theme.upsert({
    where: { id: "theme-royal-khmer" },
    update: { name: "Red Royal Khmer", isActive: true },
    create: {
      id: "theme-royal-khmer",
      name: "Red Royal Khmer",
      previewUrl: null,
      thumbnailUrl: null,
      isAnimated: true,
      isActive: true,
      sortOrder: 1,
    },
  });
  const themes = [themeRoyalKhmer];
  console.log("Created themes:", themes.map((t) => t.name).join(", "));

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
    themeCount: 1,
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
    themeCount: 1,
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
    themeCount: 1,
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
    themeCount: 1,
  };

  const packageSaving = await prisma.package.upsert({
    where: { slug: "saving" },
    update: savingData,
    create: { ...savingData, slug: "saving" },
  });
  const packageA = await prisma.package.upsert({
    where: { slug: "package-a" },
    update: standardData,
    create: { ...standardData, slug: "package-a" },
  });
  const packageB = await prisma.package.upsert({
    where: { slug: "package-b" },
    update: premiereData,
    create: { ...premiereData, slug: "package-b" },
  });
  const packageC = await prisma.package.upsert({
    where: { slug: "package-c" },
    update: royaltyData,
    create: { ...royaltyData, slug: "package-c" },
  });
  console.log("Created packages: Saving, Standard, Premiere, Royalty");

  // Every package gets the single Royal Khmer theme (themes no longer gate by package).
  const packageThemeAssignments = [packageSaving, packageA, packageB, packageC].map((p) => ({
    packageId: p.id,
    themeId: themeRoyalKhmer.id,
  }));
  for (const assignment of packageThemeAssignments) {
    await prisma.packageTheme.upsert({
      where: { packageId_themeId: assignment },
      update: {},
      create: assignment,
    });
  }
  console.log("Assigned Royal Khmer to all packages");

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

  // Remove every non–Royal Khmer theme. Repoint any invitations that still use a
  // retired theme onto Royal Khmer first (frees the FK), then delete the rest
  // and their package assignments + exclusive-event grants.
  const currentThemeIds = themes.map((t) => t.id);
  await prisma.invitation.updateMany({
    where: { themeId: { notIn: currentThemeIds } },
    data: { themeId: themeRoyalKhmer.id },
  });
  await prisma.packageTheme.deleteMany({ where: { themeId: { notIn: currentThemeIds } } });
  await prisma.eventTheme.deleteMany({ where: { themeId: { notIn: currentThemeIds } } });
  const { count: removed } = await prisma.theme.deleteMany({ where: { id: { notIn: currentThemeIds } } });
  if (removed > 0) console.log(`Deleted ${removed} retired theme(s)`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
