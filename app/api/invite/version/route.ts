import { NextRequest, NextResponse } from "next/server";
import { getInviteVersion } from "@/lib/utils/invite-cache";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ version: 0 });
  const version = await getInviteVersion(slug);
  return NextResponse.json({ version });
}
