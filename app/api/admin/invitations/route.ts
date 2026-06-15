import { NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      theme: { select: { name: true } },
      event: {
        select: {
          title: true,
          slug: true,
          eventDate: true,
          user: { select: { name: true, email: true } },
        },
      },
      _count: { select: { sections: true, photos: true } },
    },
    take: 200,
  });

  return NextResponse.json({ success: true, data: invitations });
}
