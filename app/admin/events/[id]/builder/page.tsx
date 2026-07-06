import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { EventBuilder } from "../_components/EventBuilder";

export const metadata = { title: "Freeform Builder" };

// The Freeform design surface (drag-and-drop canvas). Reached from the Design
// step when the event uses the Freeform theme; saving here marks the event as
// theme-freeform so the live invite renders the builder draft.
export default async function EventBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { invitation: true },
  });
  if (!event) notFound();

  const eventData = {
    id: event.id,
    title: event.title,
    eventType: event.eventType,
    eventDate: event.eventDate.toISOString(),
    venueName: event.venueName,
    venueMapUrl: event.venueMapUrl,
    slug: event.slug,
  };

  const invData = event.invitation
    ? {
        id: event.invitation.id,
        overlayConfig: event.invitation.overlayConfig as Record<string, unknown> | null,
        isPublished: event.invitation.isPublished,
        shareLink: event.invitation.shareLink,
        backgroundUrl: event.invitation.backgroundUrl,
        backgroundVideoUrl: event.invitation.backgroundVideoUrl,
        coverUrl: event.invitation.coverUrl,
      }
    : null;

  return <EventBuilder event={eventData} invitation={invData} />;
}
