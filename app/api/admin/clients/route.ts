import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession, hashPassword } from "@/lib/services/auth.service";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.user.findMany({
    where: { role: "client" },
    orderBy: { createdAt: "desc" },
    include: {
      userPackages: {
        orderBy: { grantedAt: "desc" },
        take: 1,
        include: { package: { select: { name: true, slug: true } } },
      },
    },
  });

  return NextResponse.json({ success: true, data: clients });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, email, password, packageId, expiresAt, notes } = await req.json();

    if (!name || !email || !password || !packageId) {
      return NextResponse.json({ error: "name, email, password, and packageId are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password as string);

    const user = await prisma.user.create({
      data: {
        name: name as string,
        email: email as string,
        passwordHash,
        role: "client",
        userPackages: {
          create: {
            packageId: packageId as string,
            createdBy: session.sub,
            expiresAt: expiresAt ? new Date(expiresAt as string) : undefined,
            notes: notes as string | undefined,
          },
        },
      },
      include: { userPackages: { include: { package: true } } },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
