import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const themes = await prisma.theme.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ success: true, data: themes });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, previewUrl, thumbnailUrl, isAnimated, sortOrder } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const theme = await prisma.theme.create({
      data: {
        name: name as string,
        previewUrl: previewUrl as string | undefined,
        thumbnailUrl: thumbnailUrl as string | undefined,
        isAnimated: !!isAnimated,
        sortOrder: Number(sortOrder ?? 0),
      },
    });

    return NextResponse.json({ success: true, data: theme }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
  }
}
