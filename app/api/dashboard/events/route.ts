import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { ThemeService } from "@/lib/services/theme.service";
import { PackageService } from "@/lib/services/package.service";
import { generateSlug } from "@/lib/utils/slug";

async function requireClient() {
  const session = await getSession();
  if (!session || session.role !== "client") return null;
  return session;
}

export async function GET() {
  const session = await requireClient();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    include: { invitation: { select: { isPublished: true } } },
  });

  return NextResponse.json({ success: true, data: events });
}

export async function POST(req: NextRequest) {
  const session = await requireClient();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, eventType, eventDate, venueName, venueMapUrl } = await req.json();

    if (!title || !eventType || !eventDate) {
      return NextResponse.json({ error: "title, eventType, and eventDate are required" }, { status: 400 });
    }

    const date = new Date(eventDate as string);
    const slug = generateSlug(title as string, date);

    const userPackage = await PackageService.getClientPackage(session.sub);
    const themes = userPackage ? await ThemeService.getThemesForPackage(userPackage.packageId) : [];
    const firstTheme = themes[0];

    if (!firstTheme) {
      return NextResponse.json({ error: "No themes available for your package" }, { status: 400 });
    }

    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${slug}`;

    const event = await prisma.event.create({
      data: {
        userId: session.sub,
        title: title as string,
        eventType: eventType as string,
        eventDate: date,
        venueName: venueName as string | null,
        venueMapUrl: venueMapUrl as string | null,
        slug,
        invitation: {
          create: { themeId: firstTheme.id, shareLink },
        },
      },
    });

    return NextResponse.json({ success: true, eventId: event.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
