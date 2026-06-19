import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";

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

// Events are created and assigned by an administrator only — clients can no
// longer self-create. Admin event creation lives in the admin panel.
export async function POST() {
  return NextResponse.json(
    { error: "Events are created by an administrator. Please contact your admin." },
    { status: 403 }
  );
}
