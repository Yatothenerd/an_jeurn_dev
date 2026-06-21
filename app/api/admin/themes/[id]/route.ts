import { NextResponse } from "next/server";

// Theme model removed. Use /api/admin/events/[id] instead.
export function GET() {
  return NextResponse.json({ error: "Themes have been removed. Manage events directly." }, { status: 410 });
}
export function PATCH() {
  return NextResponse.json({ error: "Themes have been removed. Manage events directly." }, { status: 410 });
}
export function DELETE() {
  return NextResponse.json({ error: "Themes have been removed. Manage events directly." }, { status: 410 });
}
