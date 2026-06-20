import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { bustInviteCache } from "@/lib/utils/invite-cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { action?: string; backgroundUrl?: string | null };

  if (body.action === "force-unpublish") {
    const inv = await prisma.invitation.update({
      where: { id },
      data: { isPublished: false },
      include: { event: { select: { slug: true } } },
    });
    await bustInviteCache(inv.event.slug);
    return NextResponse.json({ success: true });
  }

  if (body.action === "force-publish") {
    const inv = await prisma.invitation.update({
      where: { id },
      data: { isPublished: true },
      include: { event: { select: { slug: true } } },
    });
    await bustInviteCache(inv.event.slug);
    return NextResponse.json({ success: true });
  }

  // Admin-only single background (used by single-background themes like Spotlight).
  if ("backgroundUrl" in body) {
    const inv = await prisma.invitation.update({
      where: { id },
      data: { backgroundUrl: body.backgroundUrl || null },
      include: { event: { select: { slug: true } } },
    });
    await bustInviteCache(inv.event.slug);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const inv = await prisma.invitation.findUnique({
    where: { id },
    include: {
      event: { include: { guests: { orderBy: { name: "asc" } } } },
      theme: { select: { name: true } },
    },
  });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: inv });
}
