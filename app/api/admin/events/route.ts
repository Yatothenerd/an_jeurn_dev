import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { generateSlug } from "@/lib/utils/slug";

// Admin creates an event and assigns it to a client.
// An empty invitation is auto-created; admin configures its content via EventWizard.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, title, eventType, eventDate, venueName, venueMapUrl } = await req.json();

    if (!userId || !title || !eventType || !eventDate) {
      return NextResponse.json(
        { error: "userId, title, eventType, and eventDate are required" },
        { status: 400 }
      );
    }

    const client = await prisma.user.findFirst({ where: { id: userId as string, role: "client" } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const date = new Date(eventDate as string);
    const slug = generateSlug(title as string, date);
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${slug}`;

    const event = await prisma.event.create({
      data: {
        userId:      userId as string,
        title:       title as string,
        eventType:   eventType as string,
        eventDate:   date,
        venueName:   (venueName as string) || null,
        venueMapUrl: (venueMapUrl as string) || null,
        slug,
        // Auto-create an empty invitation; admin configures content in EventWizard
        invitation: { create: { shareLink, contentType: "photo" } },
      },
    });

    return NextResponse.json({ success: true, eventId: event.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
