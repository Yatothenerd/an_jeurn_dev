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

  // Themes
  const themes = await Promise.all([
    prisma.theme.upsert({
      where: { id: "theme-classic-white" },
      update: {},
      create: {
        id: "theme-classic-white",
        name: "Classic White",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: false,
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-rose-garden" },
      update: {},
      create: {
        id: "theme-rose-garden",
        name: "Rose Garden",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: false,
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-royal-khmer" },
      update: { name: "Red Royal Khmer" },
      create: {
        id: "theme-royal-khmer",
        name: "Red Royal Khmer",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: true,
        isActive: true,
        sortOrder: 7,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-navy-toile" },
      update: {},
      create: {
        id: "theme-navy-toile",
        name: "Navy Toile",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: false,
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-olive-arch" },
      update: {},
      create: {
        id: "theme-olive-arch",
        name: "Olive Arch",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: false,
        isActive: true,
        sortOrder: 6,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-champagne-noir" },
      update: {},
      create: {
        id: "theme-champagne-noir",
        name: "Champagne Noir",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: true,
        isActive: true,
        sortOrder: 8,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-vintage-lace" },
      update: {},
      create: {
        id: "theme-vintage-lace",
        name: "Vintage Lace",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: false,
        isActive: true,
        sortOrder: 4,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-cocoa-doily" },
      update: {},
      create: {
        id: "theme-cocoa-doily",
        name: "Cocoa Doily",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: false,
        isActive: true,
        sortOrder: 5,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-starlight" },
      update: {},
      create: {
        id: "theme-starlight",
        name: "Starlight",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: true,
        isActive: true,
        sortOrder: 9,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-cinematic" },
      update: {},
      create: {
        id: "theme-cinematic",
        name: "Cinematic",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: true,
        isActive: true,
        sortOrder: 10,
      },
    }),
  ]);
  console.log("Created themes:", themes.map((t) => t.name).join(", "));

  const [themeClassicWhite, themeRoseGarden, themeRoyalKhmer, themeNavyToile, themeOliveArch, themeChampagneNoir, themeVintageLace, themeCocoaDoily, themeStarlight, themeCinematic] = themes;

  // Packages — see the package revision spec. Defined as plain data + idempotent
  // upsert (create AND update) so re-seeding applies revisions to existing rows.
  // Slugs are kept stable (package-a/b/c) to preserve UserPackage references.
  const savingData = {
    name: "Saving",
    priceUsd: 50,
    maxSections: 4,
    maxPhotos: 4, // up to 4 photos (watermarked)
    maxGuests: 50,
    hasMusic: false,
    hasVideo: false,
    hasKhqr: false,
    hasWishing: false,
    hasHosting: true,
    hasCustomThumb: false, // theme thumbnail only
    hasLocation: false,
    hasOpeningCover: false, // no opening cover
    hasWatermark: true,
    hasGuestControl: false,
    guestControlType: "none" as const,
    guestEditLimit: null,
    hasLogo: false,
    galleryType: "basic",
    themeCount: 2,
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
    hasCustomThumb: false, // theme thumbnail or preset image, not custom
    hasLocation: true,
    hasOpeningCover: false,
    hasWatermark: true, // watermark applied
    hasGuestControl: true,
    guestControlType: "limited" as const,
    guestEditLimit: 3,
    hasLogo: false,
    galleryType: "standard",
    themeCount: 2,
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
    hasCustomThumb: true, // admin designs or client provides
    hasLocation: true,
    hasOpeningCover: false,
    hasWatermark: false, // no watermark
    hasGuestControl: true,
    guestControlType: "full" as const,
    guestEditLimit: null,
    hasLogo: true,
    galleryType: "standard",
    themeCount: 4,
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
    hasOpeningCover: true, // motion opening screen
    hasWatermark: false,
    hasGuestControl: true,
    guestControlType: "full" as const,
    guestEditLimit: null,
    hasLogo: true,
    galleryType: "premium",
    themeCount: 8,
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

  // PackageThemes — assign themes to packages
  // Saving: basic themes only (Classic White, Navy Toile)
  // Package A: same 2 basic themes
  // Package B: 4 themes (adds Rose Garden, Cocoa Doily)
  // Package C: all 8 themes

  const packageThemeAssignments = [
    // Saving — 2 basic themes
    { packageId: packageSaving.id, themeId: themeClassicWhite.id },
    { packageId: packageSaving.id, themeId: themeNavyToile.id },
    // Package A — same 2 basic themes
    { packageId: packageA.id, themeId: themeClassicWhite.id },
    { packageId: packageA.id, themeId: themeNavyToile.id },
    // Package B — 4 themes
    { packageId: packageB.id, themeId: themeClassicWhite.id },
    { packageId: packageB.id, themeId: themeNavyToile.id },
    { packageId: packageB.id, themeId: themeRoseGarden.id },
    { packageId: packageB.id, themeId: themeCocoaDoily.id },
    // Package C — all themes
    { packageId: packageC.id, themeId: themeClassicWhite.id },
    { packageId: packageC.id, themeId: themeNavyToile.id },
    { packageId: packageC.id, themeId: themeRoseGarden.id },
    { packageId: packageC.id, themeId: themeVintageLace.id },
    { packageId: packageC.id, themeId: themeCocoaDoily.id },
    { packageId: packageC.id, themeId: themeOliveArch.id },
    { packageId: packageC.id, themeId: themeRoyalKhmer.id },
    { packageId: packageC.id, themeId: themeChampagneNoir.id },
    { packageId: packageC.id, themeId: themeStarlight.id },
    { packageId: packageC.id, themeId: themeCinematic.id },
  ];

  for (const assignment of packageThemeAssignments) {
    await prisma.packageTheme.upsert({
      where: { packageId_themeId: assignment },
      update: {},
      create: assignment,
    });
  }
  console.log("Assigned themes to packages");

  // Demo client (role: client) with an active Package C — for testing the dashboard.
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
      data: {
        userId: client.id,
        packageId: packageC.id,
        createdBy: admin.id,
        status: "active",
      },
    });
  }
  console.log("Created demo client:", client.email, "(Package C)");

  // Clean up themes removed in this revision (e.g. on a previously-seeded DB).
  // Deactivate rather than delete so existing invitations keep their FK intact.
  const currentThemeIds = themes.map((t) => t.id);
  await prisma.packageTheme.deleteMany({ where: { themeId: { notIn: currentThemeIds } } });
  const { count: deactivated } = await prisma.theme.updateMany({
    where: { id: { notIn: currentThemeIds }, isActive: true },
    data: { isActive: false },
  });
  if (deactivated > 0) console.log(`Deactivated ${deactivated} retired theme(s)`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
