import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { ThemeService } from "@/lib/services/theme.service";
import { PackageService } from "@/lib/services/package.service";
import { generateSlug } from "@/lib/utils/slug";

// Admin creates and assigns an event to a client. (Clients can no longer
// self-create — see app/api/dashboard/events/route.ts.)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, title, eventType, eventDate, venueName, venueMapUrl } = await req.json();

    if (!userId || !title || !eventType || !eventDate) {
      return NextResponse.json({ error: "userId, title, eventType, and eventDate are required" }, { status: 400 });
    }

    const client = await prisma.user.findFirst({ where: { id: userId as string, role: "client" } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const userPackage = await PackageService.getClientPackage(userId as string);
    const themes = userPackage ? await ThemeService.getThemesForPackage(userPackage.packageId) : [];
    const firstTheme = themes[0];
    if (!firstTheme) {
      return NextResponse.json({ error: "Client has no active package with available themes" }, { status: 400 });
    }

    const date = new Date(eventDate as string);
    const slug = generateSlug(title as string, date);
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${slug}`;

    const event = await prisma.event.create({
      data: {
        userId: userId as string,
        title: title as string,
        eventType: eventType as string,
        eventDate: date,
        venueName: (venueName as string) || null,
        venueMapUrl: (venueMapUrl as string) || null,
        slug,
        invitation: { create: { themeId: firstTheme.id, shareLink } },
      },
    });

    return NextResponse.json({ success: true, eventId: event.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
