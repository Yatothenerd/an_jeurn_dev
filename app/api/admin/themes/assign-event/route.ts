import { NextResponse } from "next/server";

// Theme model removed. Events are configured directly via EventWizard.
export function POST() {
  return NextResponse.json({ error: "Themes have been removed. Manage events directly." }, { status: 410 });
}
