import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { redis } from "@/lib/db/redis";

const EDITABLE_FLAGS = [
  "hasMusic", "hasVideo", "hasKhqr", "hasWishing", "hasHosting",
  "hasCustomThumb", "hasGuestControl", "hasLogo",
] as const;

const EDITABLE_LIMITS = ["maxSections", "maxPhotos", "maxGuests"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  for (const key of EDITABLE_FLAGS) {
    if (key in body) data[key] = !!body[key];
  }
  for (const key of EDITABLE_LIMITS) {
    if (key in body) data[key] = Number(body[key]);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  }

  try {
    const pkg = await prisma.package.update({ where: { id }, data });

    // Bust Redis cache for this package's themes (feature flags may gate theme access)
    await redis.del(`themes:package:${id}`);

    return NextResponse.json({ success: true, data: pkg });
  } catch {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
}
