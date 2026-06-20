import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { ThemeService } from "@/lib/services/theme.service";
import { PackageService } from "@/lib/services/package.service";
import { getTheme } from "@/lib/themes/registry";
import { BuilderClient } from "./_components/BuilderClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BuilderPage({ params }: PageProps) {
  const { id: eventId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const [event, userPackage] = await Promise.all([
    prisma.event.findFirst({
      where: { id: eventId, userId: session.sub },
      include: {
        invitation: {
          include: {
            theme: true,
            sections: { orderBy: { sortOrder: "asc" } },
            photos: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    }),
    PackageService.getClientPackage(session.sub),
  ]);

  if (!event) notFound();

  // Themes allowed for this event — the client's package pool plus any themes
  // assigned exclusively to this event. Exclusive themes (admin-assigned, not in
  // the package preset) are tagged in the picker.
  const poolThemes = userPackage
    ? await ThemeService.getThemesForPackage(userPackage.packageId)
    : [];
  const exclusiveThemes = await ThemeService.getExclusiveThemesForEvent(eventId);
  const poolIds = new Set(poolThemes.map((t) => t.id));
  const exclusiveThemeIds = exclusiveThemes.filter((t) => !poolIds.has(t.id)).map((t) => t.id);
  const themesById = new Map<string, (typeof exclusiveThemes)[number]>();
  for (const t of poolThemes) themesById.set(t.id, t);
  for (const t of exclusiveThemes) themesById.set(t.id, t);
  const allowedThemes = Array.from(themesById.values());

  if (!event.invitation) {
    // Auto-create invitation with first allowed theme
    const firstTheme = allowedThemes[0];
    if (!firstTheme) notFound();

    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${event.slug}`;
    const inv = await prisma.invitation.create({
      data: { eventId: event.id, themeId: firstTheme.id, shareLink },
      include: {
        theme: true,
        sections: { orderBy: { sortOrder: "asc" } },
        photos: { orderBy: { sortOrder: "asc" } },
      },
    });
    (event as typeof event & { invitation: typeof inv }).invitation = inv;
  }

  const invitation = event.invitation!;

  const pkg = userPackage?.package;

  return (
    <BuilderClient
      eventId={event.id}
      eventTitle={event.title}
      invitationId={invitation.id}
      currentThemeId={invitation.themeId}
      shareLink={invitation.shareLink}
      isPublished={invitation.isPublished}
      showWatermark={invitation.showWatermark}
      musicUrl={invitation.musicUrl}
      sections={invitation.sections as never}
      photos={invitation.photos as never}
      allowedThemes={allowedThemes as never}
      exclusiveThemeIds={exclusiveThemeIds}
      usesBackgrounds={!!getTheme(invitation.themeId).usesBackgrounds}
      pkg={pkg ? {
        maxSections: pkg.maxSections,
        maxPhotos: pkg.maxPhotos,
        hasMusic: pkg.hasMusic,
        hasVideo: pkg.hasVideo,
        hasKhqr: pkg.hasKhqr,
        hasWishing: pkg.hasWishing,
        hasHosting: pkg.hasHosting,
        galleryType: pkg.galleryType,
      } : null}
    />
  );
}
