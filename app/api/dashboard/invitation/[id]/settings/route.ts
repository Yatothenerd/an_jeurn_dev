import { NextResponse } from "next/server";

// Invitation settings (publish status, watermark, etc.) are controlled by
// the administrator. Publishing happens automatically when a theme is assigned.
export async function PATCH() {
  return NextResponse.json(
    { error: "Invitation settings are managed by your administrator." },
    { status: 403 }
  );
}
