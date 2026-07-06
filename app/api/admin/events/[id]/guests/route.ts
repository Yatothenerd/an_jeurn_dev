import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { shortToken } from "@/lib/utils/token";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// POST — add a guest to this event (personal token auto-generated so the
// guest gets a personalized invite link immediately).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { name, contact } = (await req.json()) as { name?: string; contact?: string };
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const guest = await prisma.guest.create({
    data: {
      eventId: id,
      name: name.trim(),
      contact: contact?.trim() || null,
      token: shortToken(),
    },
  });
  return NextResponse.json({ guest });
}

// DELETE — remove a guest (?guestId=xxx)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const guestId = new URL(req.url).searchParams.get("guestId");
  if (!guestId) return NextResponse.json({ error: "guestId required" }, { status: 400 });

  // Scope the delete to this event so a stray id can't touch other events.
  const { count } = await prisma.guest.deleteMany({ where: { id: guestId, eventId: id } });
  if (count === 0) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
