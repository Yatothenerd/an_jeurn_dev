import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { bustInviteCacheByInvitationId } from "@/lib/utils/invite-cache";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

async function getOrCreateInvitation(eventId: string) {
  const existing = await prisma.invitation.findUnique({ where: { eventId } });
  if (existing) return existing;
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  return prisma.invitation.create({
    data: {
      eventId,
      shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${event.slug}`,
      contentType: "photo",
    },
  });
}

// GET — list photos for this event's invitation
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const inv = await prisma.invitation.findUnique({
    where: { eventId: id },
    select: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json({ photos: inv?.photos ?? [] });
}

// POST — add a photo (URL already uploaded to Cloudinary)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const inv = await getOrCreateInvitation(id);
  const last = await prisma.photo.findFirst({
    where: { invitationId: inv.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const photo = await prisma.photo.create({
    data: { invitationId: inv.id, url, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  await bustInviteCacheByInvitationId(inv.id);
  return NextResponse.json({ photo });
}

// DELETE — remove a photo (?photoId=xxx)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const photoId = new URL(req.url).searchParams.get("photoId");
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, invitation: { eventId: id } },
    select: { id: true, invitationId: true },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.photo.delete({ where: { id: photoId } });
  await bustInviteCacheByInvitationId(photo.invitationId);
  return NextResponse.json({ success: true });
}
