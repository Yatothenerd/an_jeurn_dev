import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { bustInviteCacheByInvitationId } from "@/lib/utils/invite-cache";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// GET — full event + invitation data for the EventWizard
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      invitation: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: event });
}

// PATCH — update event metadata and/or invitation design config
// Body may include any combination of event fields and invitation fields.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  // Event-level fields
  const eventFields: Record<string, unknown> = {};
  for (const k of ["title", "eventType", "eventDate", "venueName", "venueMapUrl", "status"]) {
    if (k in body) eventFields[k] = body[k];
  }
  if (eventFields.eventDate) eventFields.eventDate = new Date(eventFields.eventDate as string);

  // Invitation design fields
  const invFields: Record<string, unknown> = {};
  for (const k of [
    "contentType", "defaultSections", "overlayConfig",
    "backgroundUrl", "backgroundVideoUrl", "coverUrl",
    "thumbnailUrl", "previewUrl", "musicUrl",
    "isAnimated", "isPublished", "showWatermark",
  ]) {
    if (k in body) invFields[k] = body[k];
  }

  try {
    // Run event update and invitation upsert in a transaction
    const [event] = await prisma.$transaction(async (tx) => {
      const updatedEvent = Object.keys(eventFields).length > 0
        ? await tx.event.update({ where: { id }, data: eventFields })
        : await tx.event.findUniqueOrThrow({ where: { id } });

      if (Object.keys(invFields).length > 0) {
        await tx.invitation.upsert({
          where: { eventId: id },
          update: invFields,
          create: {
            eventId: id,
            shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${updatedEvent.slug}`,
            contentType: "photo",
            ...invFields,
          },
        });
      }

      return [updatedEvent];
    });

    // Bust invite cache so clients see changes immediately
    const inv = await prisma.invitation.findUnique({
      where: { eventId: id },
      select: { id: true },
    });
    if (inv) await bustInviteCacheByInvitationId(inv.id);

    return NextResponse.json({ success: true, data: { id: event.id } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
