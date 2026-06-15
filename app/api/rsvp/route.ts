import { NextRequest, NextResponse } from "next/server";
import { GuestService } from "@/lib/services/guest.service";
import { NotifyService } from "@/lib/services/notify.service";
import { rateLimit } from "@/lib/utils/rate-limit";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  // Rate limit: 5 RSVPs per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success } = await rateLimit(`rsvp:${ip}`, 5, 60);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json() as {
    eventId?: string;
    name?: string;
    contact?: string;
    contactType?: string;
    mealPref?: string;
    rsvpStatus?: "attending" | "declined";
  };

  if (!body.eventId || !body.name || !body.rsvpStatus) {
    return NextResponse.json({ error: "eventId, name and rsvpStatus are required" }, { status: 400 });
  }

  try {
    const guest = await GuestService.submitRSVP(body.eventId, {
      name: body.name,
      contact: body.contact,
      contactType: body.contactType,
      mealPref: body.mealPref,
      rsvpStatus: body.rsvpStatus,
    });

    // Fire-and-forget notification to client
    const event = await prisma.event.findUnique({
      where: { id: body.eventId },
      include: { user: { select: { email: true } } },
    });
    if (event?.user.email) {
      await NotifyService.notifyRsvp(event.user.email, event.title, body.name, body.rsvpStatus).catch(console.error);
    }

    return NextResponse.json({ success: true, data: guest }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
