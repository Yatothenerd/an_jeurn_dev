import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { resolveDesign, FREEFORM_THEME_ID } from "@/lib/themes/design";
import { getTheme } from "@/lib/themes/registry";
import { PublishPanel, type ChecklistItem } from "./_components/PublishPanel";

export const metadata = { title: "Event — Publish" };

// Step 5 — Publish: one place to go live, gated by an automated checklist.
export default async function EventPublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      invitation: {
        include: { sections: { where: { isVisible: true }, select: { id: true, type: true, sortOrder: true, content: true } } },
      },
      user: {
        select: {
          userPackages: {
            where: { status: "active" },
            include: { package: { select: { hasWatermark: true, name: true } } },
            orderBy: { grantedAt: "desc" },
            take: 1,
          },
        },
      },
      _count: { select: { guests: true } },
    },
  });
  if (!event) notFound();

  const inv = event.invitation;
  const design = resolveDesign({
    overlayConfig: inv?.overlayConfig ?? null,
    defaultSections: inv?.defaultSections ?? null,
    sectionRows: inv?.sections ?? [],
  });

  const oc = (inv?.overlayConfig ?? {}) as Record<string, unknown>;
  const isFreeform = design.themeId === FREEFORM_THEME_ID;
  const designChosen = typeof oc.themeId === "string" || isFreeform;
  const includedSections = design.sections.filter((s) => s.included).length;
  const hasContent = isFreeform || includedSections > 0;
  const dateInFuture = event.eventDate.getTime() > Date.now();
  const hasCoverAsset = !!(inv?.coverUrl || inv?.backgroundUrl || inv?.backgroundVideoUrl);
  const pkg = event.user.userPackages[0]?.package ?? null;

  // Required items gate the publish button; warnings don't.
  const checklist: ChecklistItem[] = [
    {
      label: "Design chosen",
      ok: designChosen,
      required: true,
      detail: designChosen ? getTheme(design.themeId).name : "Pick a template or theme in the Design step.",
    },
    {
      label: "Content in place",
      ok: hasContent,
      required: true,
      detail: isFreeform
        ? "Designed on the Freeform canvas."
        : hasContent
          ? `${includedSections} section${includedSections === 1 ? "" : "s"} enabled.`
          : "Enable at least one section in the Content step.",
    },
    {
      label: "Event date is in the future",
      ok: dateInFuture,
      required: false,
      detail: dateInFuture
        ? event.eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "The date is in the past — check the Details step.",
    },
    {
      label: "Cover / background image set",
      ok: hasCoverAsset,
      required: false,
      detail: hasCoverAsset ? "Guests see it on the opening gate." : "Optional, but the gate looks plain without one.",
    },
    {
      label: "Guests added",
      ok: event._count.guests > 0,
      required: false,
      detail: event._count.guests > 0
        ? `${event._count.guests} guest${event._count.guests === 1 ? "" : "s"} with personal links.`
        : "Optional — you can also share the public link.",
    },
  ];

  return (
    <PublishPanel
      eventId={event.id}
      slug={event.slug}
      isPublished={inv?.isPublished ?? false}
      hasInvitation={!!inv}
      checklist={checklist}
      watermarkNote={
        pkg
          ? pkg.hasWatermark
            ? `The ${pkg.name} package shows the An-Jeurn watermark on the invitation.`
            : null
          : "No active package — the invitation shows the watermark by default."
      }
    />
  );
}
