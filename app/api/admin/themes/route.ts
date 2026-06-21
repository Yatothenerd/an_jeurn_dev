import { NextResponse } from "next/server";

// Theme model removed. Use /api/admin/events instead.
export function GET() {
  return NextResponse.json({ error: "Themes have been removed. Manage events directly." }, { status: 410 });
}
export function POST() {
  return NextResponse.json({ error: "Themes have been removed. Manage events directly." }, { status: 410 });
}
