import { PrismaClient } from "../app/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
      where: { id: "theme-blush-rose" },
      update: {},
      create: {
        id: "theme-blush-rose",
        name: "Blush Rose",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: false,
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-golden-khmer" },
      update: {},
      create: {
        id: "theme-golden-khmer",
        name: "Golden Khmer",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: true,
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-midnight-bloom" },
      update: {},
      create: {
        id: "theme-midnight-bloom",
        name: "Midnight Bloom",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: true,
        isActive: true,
        sortOrder: 4,
      },
    }),
    prisma.theme.upsert({
      where: { id: "theme-royal-emerald" },
      update: {},
      create: {
        id: "theme-royal-emerald",
        name: "Royal Emerald",
        previewUrl: null,
        thumbnailUrl: null,
        isAnimated: true,
        isActive: true,
        sortOrder: 5,
      },
    }),
  ]);
  console.log("Created themes:", themes.map((t) => t.name).join(", "));

  const [themeClassicWhite, themeBlushRose, themeGoldenKhmer, themeMidnightBloom, themeRoyalEmerald] = themes;

  // Packages
  const packageSaving = await prisma.package.upsert({
    where: { slug: "saving" },
    update: {},
    create: {
      name: "Saving",
      slug: "saving",
      priceUsd: 50,
      maxSections: 4,
      maxPhotos: 10,
      maxGuests: 50,
      hasMusic: false,
      hasVideo: false,
      hasKhqr: false,
      hasWishing: false,
      hasHosting: true,
      hasCustomThumb: false,
      hasGuestControl: false,
      guestControlType: "none",
      guestEditLimit: null,
      hasLogo: false,
      galleryType: "basic",
      themeCount: 2,
    },
  });

  const packageA = await prisma.package.upsert({
    where: { slug: "package-a" },
    update: {},
    create: {
      name: "Package A",
      slug: "package-a",
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
      hasGuestControl: true,
      guestControlType: "limited",
      guestEditLimit: 3,
      hasLogo: false,
      galleryType: "standard",
      themeCount: 2,
    },
  });

  const packageB = await prisma.package.upsert({
    where: { slug: "package-b" },
    update: {},
    create: {
      name: "Package B",
      slug: "package-b",
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
      hasGuestControl: true,
      guestControlType: "full",
      guestEditLimit: null,
      hasLogo: true,
      galleryType: "standard",
      themeCount: 4,
    },
  });

  const packageC = await prisma.package.upsert({
    where: { slug: "package-c" },
    update: {},
    create: {
      name: "Package C",
      slug: "package-c",
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
      hasGuestControl: true,
      guestControlType: "full",
      guestEditLimit: null,
      hasLogo: true,
      galleryType: "premium",
      themeCount: 5,
    },
  });
  console.log("Created packages: Saving, Package A, Package B, Package C");

  // PackageThemes — assign themes to packages
  // Saving: basic themes only (Classic White, Blush Rose)
  // Package A: same 2 basic themes
  // Package B: 4 themes (all except Royal Emerald)
  // Package C: all 5 themes

  const packageThemeAssignments = [
    // Saving
    { packageId: packageSaving.id, themeId: themeClassicWhite.id },
    { packageId: packageSaving.id, themeId: themeBlushRose.id },
    // Package A
    { packageId: packageA.id, themeId: themeClassicWhite.id },
    { packageId: packageA.id, themeId: themeBlushRose.id },
    // Package B
    { packageId: packageB.id, themeId: themeClassicWhite.id },
    { packageId: packageB.id, themeId: themeBlushRose.id },
    { packageId: packageB.id, themeId: themeGoldenKhmer.id },
    { packageId: packageB.id, themeId: themeMidnightBloom.id },
    // Package C — all themes
    { packageId: packageC.id, themeId: themeClassicWhite.id },
    { packageId: packageC.id, themeId: themeBlushRose.id },
    { packageId: packageC.id, themeId: themeGoldenKhmer.id },
    { packageId: packageC.id, themeId: themeMidnightBloom.id },
    { packageId: packageC.id, themeId: themeRoyalEmerald.id },
  ];

  for (const assignment of packageThemeAssignments) {
    await prisma.packageTheme.upsert({
      where: { packageId_themeId: assignment },
      update: {},
      create: assignment,
    });
  }
  console.log("Assigned themes to packages");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
