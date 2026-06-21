import { NextResponse } from "next/server";

// PackageTheme model removed. Themes are no longer assigned to packages.
export function POST() {
  return NextResponse.json({ error: "Theme assignment removed. Events are managed directly." }, { status: 410 });
}
