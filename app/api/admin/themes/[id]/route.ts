import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const theme = await prisma.theme.findUnique({ where: { id } });
  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: theme });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const allowedFields = ["name", "previewUrl", "thumbnailUrl", "isAnimated", "sortOrder", "isActive"];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) data[key] = body[key];
  }
  if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder);

  try {
    const theme = await prisma.theme.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: theme });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
