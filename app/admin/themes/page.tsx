import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { ThemesPageClient } from "./_components/ThemesPageClient";
import { listThemeSummaries } from "@/lib/themes/registry";

export const metadata = { title: "Admin — Theme Studio" };

// Theme Studio: admins create reusable Templates (from base Themes) and tag
// them to packages. Templates are the only catalog events choose from.
export default async function ThemesPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const [templates, packages] = await Promise.all([
    prisma.template.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { packages: true },
    }),
    prisma.package.findMany({ orderBy: { priceUsd: "asc" } }),
  ]);

  const tpl = templates.map((t) => ({
    id: t.id,
    name: t.name,
    isActive: t.isActive,
    coverUrl: t.coverUrl,
    backgroundUrl: t.backgroundUrl,
    thumbnailUrl: t.thumbnailUrl,
    overlayConfig: t.overlayConfig as Record<string, unknown> | null,
    packageIds: t.packages.map((p) => p.packageId),
  }));
  const pkgs = packages.map((p) => ({ id: p.id, name: p.name, slug: p.slug }));

  return <ThemesPageClient templates={tpl} packages={pkgs} builtinThemes={listThemeSummaries()} />;
}
