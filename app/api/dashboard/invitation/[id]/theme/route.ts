import { NextResponse } from "next/server";

// Theme is controlled exclusively by the administrator.
// Clients cannot change the theme assigned to their event.
export async function PATCH() {
  return NextResponse.json(
    { error: "Theme is managed by your administrator and cannot be changed here." },
    { status: 403 }
  );
}
