import { NextRequest, NextResponse } from "next/server";
import { ThemeService } from "@/lib/services/theme.service";
import { getSession } from "@/lib/services/auth.service";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { packageId, themeIds } = await req.json() as { packageId: string; themeIds: string[] };

  if (!packageId || !Array.isArray(themeIds)) {
    return NextResponse.json({ error: "packageId and themeIds[] are required" }, { status: 400 });
  }

  await ThemeService.setThemesForPackage(packageId, themeIds);
  return NextResponse.json({ success: true });
}
