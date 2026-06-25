import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { EventBuilder } from "./_components/EventBuilder";

export const metadata = { title: "Edit Event" };

export default async function AdminEventEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { invitation: true },
  });
  if (!event) notFound();

  const eventData = {
    id:          event.id,
    title:       event.title,
    eventType:   event.eventType,
    eventDate:   event.eventDate.toISOString(),
    venueName:   event.venueName,
    venueMapUrl: event.venueMapUrl,
    slug:        event.slug,
  };

  const invData = event.invitation
    ? {
        id:                 event.invitation.id,
        contentType:        event.invitation.contentType,
        defaultSections:    event.invitation.defaultSections,
        overlayConfig:      event.invitation.overlayConfig as Record<string, unknown> | null,
        backgroundUrl:      event.invitation.backgroundUrl,
        backgroundVideoUrl: event.invitation.backgroundVideoUrl,
        coverUrl:           event.invitation.coverUrl,
        musicUrl:           event.invitation.musicUrl,
        thumbnailUrl:       event.invitation.thumbnailUrl,
        previewUrl:         event.invitation.previewUrl,
        isAnimated:         event.invitation.isAnimated,
        isPublished:        event.invitation.isPublished,
        shareLink:          event.invitation.shareLink,
      }
    : null;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={s.pageHeader}>
        <div>
          <a href="/admin/events" style={s.back}>← All events</a>
          <h1 style={s.title}>{event.title}</h1>
          <p style={s.sub}>
            {event.eventType} &middot; {new Date(event.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {event.venueName && <> &middot; {event.venueName}</>}
          </p>
        </div>
        {event.invitation?.shareLink && (
          <a href={event.invitation.shareLink} target="_blank" rel="noreferrer" style={s.viewBtn}>
            View invitation ↗
          </a>
        )}
      </div>
      <EventBuilder event={eventData} invitation={invData} />
    </div>
  );
}

const s = {
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap" as const, gap: "0.75rem" },
  back:       { display: "inline-block", fontSize: "0.875rem", color: "var(--c-muted)", textDecoration: "none", marginBottom: "0.375rem" },
  title:      { margin: "0 0 0.25rem", fontSize: "1.625rem", fontWeight: 700, color: "var(--c-text)" },
  sub:        { margin: 0, fontSize: "0.9375rem", color: "var(--c-muted)" },
  viewBtn:    { padding: "0.5rem 1.125rem", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8, textDecoration: "none", color: "var(--c-text)", fontSize: "0.9375rem", fontWeight: 600, flexShrink: 0, alignSelf: "flex-start" as const },
} as const;
