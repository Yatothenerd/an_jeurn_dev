import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { ThemesPageClient } from "./_components/ThemesPageClient";

export const metadata = { title: "Admin — Theme Builder" };

// Theme Builder: admins create reusable design templates and tag them to packages.
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

  return <ThemesPageClient templates={tpl} packages={pkgs} />;
}
