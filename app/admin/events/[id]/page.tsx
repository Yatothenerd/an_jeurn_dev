import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

// Entry point for an event: send the admin to the most useful step.
// A brand-new event (no design chosen yet) starts at Design; anything
// already configured lands on Details. (Auth + 404 handled by the layout.)
export default async function EventIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await prisma.invitation.findUnique({
    where: { eventId: id },
    select: { overlayConfig: true, defaultSections: true, _count: { select: { sections: true } } },
  });

  const oc = (inv?.overlayConfig ?? {}) as Record<string, unknown>;
  const hasDesign = typeof oc.themeId === "string" || !!oc.builderDraft;
  const hasContent = Array.isArray(inv?.defaultSections) || (inv?._count.sections ?? 0) > 0;

  redirect(`/admin/events/${id}/${hasDesign || hasContent ? "details" : "design"}`);
}
