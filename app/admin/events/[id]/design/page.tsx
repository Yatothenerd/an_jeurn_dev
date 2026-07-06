import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { listThemeSummaries } from "@/lib/themes/registry";
import { resolveDesign } from "@/lib/themes/design";
import { DesignPicker } from "./_components/DesignPicker";

export const metadata = { title: "Event — Design" };

// Step 2 — Design: choose how the invitation looks. Templates (admin-made
// presets, package-gated) or a bare base theme. Applying is always a snapshot.
export default async function EventDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, templates] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        invitation: { select: { overlayConfig: true, defaultSections: true } },
        user: {
          select: {
            userPackages: {
              where: { status: "active" },
              select: { packageId: true, package: { select: { name: true } } },
              orderBy: { grantedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.template.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { packages: { include: { package: { select: { id: true, name: true } } } } },
    }),
  ]);
  if (!event) notFound();

  const clientPkg = event.user.userPackages[0] ?? null;
  const design = resolveDesign({
    overlayConfig: event.invitation?.overlayConfig ?? null,
    defaultSections: event.invitation?.defaultSections ?? null,
    sectionRows: [],
  });

  return (
    <DesignPicker
      eventId={event.id}
      slug={event.slug}
      currentThemeId={design.themeId}
      overlayConfig={(event.invitation?.overlayConfig as Record<string, unknown> | null) ?? null}
      clientPackage={clientPkg ? { id: clientPkg.packageId, name: clientPkg.package.name } : null}
      themes={listThemeSummaries()}
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        thumbnailUrl: t.thumbnailUrl ?? t.coverUrl ?? null,
        packages: t.packages.map((p) => ({ id: p.package.id, name: p.package.name })),
      }))}
    />
  );
}
