import { NextRequest, NextResponse } from "next/server";
import { ThemeService } from "@/lib/services/theme.service";
import { getSession } from "@/lib/services/auth.service";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// POST — assign a theme exclusively to one event.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { eventId, themeId } = (await req.json()) as { eventId?: string; themeId?: string };
  if (!eventId || !themeId) {
    return NextResponse.json({ error: "eventId and themeId are required" }, { status: 400 });
  }
  await ThemeService.assignThemeToEvent(themeId, eventId);
  return NextResponse.json({ success: true }, { status: 201 });
}

// DELETE — release (pull back) a theme from an event, e.g. once it has ended.
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { eventId, themeId } = (await req.json()) as { eventId?: string; themeId?: string };
  if (!eventId || !themeId) {
    return NextResponse.json({ error: "eventId and themeId are required" }, { status: 400 });
  }
  await ThemeService.releaseThemeFromEvent(themeId, eventId);
  return NextResponse.json({ success: true });
}
