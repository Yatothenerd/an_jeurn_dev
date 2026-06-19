import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// POST /api/admin/clients/[id]/packages — grant (or switch) a client's package.
// id = userId. The client's currently-active package is revoked so the new one
// becomes the single active package (which events then inherit).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { packageId, expiresAt, notes } = (await req.json()) as {
    packageId?: string;
    expiresAt?: string;
    notes?: string;
  };

  if (!packageId) return NextResponse.json({ error: "packageId is required" }, { status: 400 });

  const [client, pkg] = await Promise.all([
    prisma.user.findUnique({ where: { id, role: "client" } }),
    prisma.package.findUnique({ where: { id: packageId } }),
  ]);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const [, granted] = await prisma.$transaction([
    prisma.userPackage.updateMany({
      where: { userId: id, status: "active" },
      data: { status: "revoked" },
    }),
    prisma.userPackage.create({
      data: {
        userId: id,
        packageId,
        createdBy: session.sub,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        notes: notes || undefined,
        status: "active",
      },
    }),
  ]);

  return NextResponse.json({ success: true, data: granted }, { status: 201 });
}
