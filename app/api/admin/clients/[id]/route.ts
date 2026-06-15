import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// GET /api/admin/clients/[id] — full client detail (id = user id)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const client = await prisma.user.findUnique({
    where: { id, role: "client" },
    include: {
      userPackages: {
        orderBy: { grantedAt: "desc" },
        include: { package: true, grantedBy: { select: { name: true } } },
      },
      events: { orderBy: { createdAt: "desc" }, include: { invitation: true } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: client });
}

// PATCH /api/admin/clients/[id] — id here is userPackage.id
// actions: "revoke" | "reactivate" | "extend"
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, expiresAt } = await req.json() as { action: string; expiresAt?: string };

  const up = await prisma.userPackage.findUnique({ where: { id } });
  if (!up) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let updated;
  if (action === "revoke") {
    updated = await prisma.userPackage.update({ where: { id }, data: { status: "revoked" } });
  } else if (action === "reactivate") {
    updated = await prisma.userPackage.update({ where: { id }, data: { status: "active" } });
  } else if (action === "extend" && expiresAt) {
    updated = await prisma.userPackage.update({
      where: { id },
      data: { expiresAt: new Date(expiresAt), status: "active" },
    });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: updated });
}
