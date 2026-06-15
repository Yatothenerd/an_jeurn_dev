import { prisma } from "@/lib/db/prisma";
import { PackageThemeAssign } from "./_components/PackageThemeAssign";

export const metadata = { title: "Admin — Assign Themes" };

export default async function AssignPage() {
  const [packages, themes] = await Promise.all([
    prisma.package.findMany({
      orderBy: { priceUsd: "asc" },
      include: { packageThemes: { select: { themeId: true } } },
    }),
    prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Map packageId → Set of assigned themeIds
  const assignmentMap: Record<string, string[]> = {};
  for (const pkg of packages) {
    assignmentMap[pkg.id] = pkg.packageThemes.map((pt: { themeId: string }) => pt.themeId);
  }

  return (
    <PackageThemeAssign
      packages={packages.map(({ packageThemes: _ignored, ...p }: typeof packages[0]) => p)}
      themes={themes}
      assignmentMap={assignmentMap}
    />
  );
}
