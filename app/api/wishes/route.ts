import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/utils/rate-limit";
import { NotifyService } from "@/lib/services/notify.service";

export async function GET(req: NextRequest) {
  const invitationId = req.nextUrl.searchParams.get("invitationId");
  if (!invitationId) return NextResponse.json({ error: "invitationId required" }, { status: 400 });

  const wishes = await prisma.wish.findMany({
    where: { invitationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, guestName: true, message: true, createdAt: true },
  });
  return NextResponse.json({ success: true, data: wishes });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success } = await rateLimit(`wish:${ip}`, 5, 60);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { invitationId, guestName, message } = await req.json() as {
    invitationId?: string;
    guestName?: string;
    message?: string;
  };

  if (!invitationId || !guestName?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "invitationId, guestName and message are required" }, { status: 400 });
  }

  // Verify invitation exists and is published
  const inv = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: { include: { user: { select: { email: true } } } } },
  });
  if (!inv || !inv.isPublished) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const wish = await prisma.wish.create({
    data: { invitationId, guestName: guestName.trim(), message: message.trim() },
  });

  // Notify client
  if (inv.event.user.email) {
    await NotifyService.notifyNewWish(inv.event.user.email, inv.event.title, guestName.trim()).catch(console.error);
  }

  return NextResponse.json({ success: true, data: { ...wish, createdAt: wish.createdAt.toISOString() } }, { status: 201 });
}
