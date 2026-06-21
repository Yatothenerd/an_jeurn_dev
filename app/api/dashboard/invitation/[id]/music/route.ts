import { NextResponse } from "next/server";

// Music is set by the administrator as part of the theme.
// Clients cannot change the music track.
export async function PATCH() {
  return NextResponse.json(
    { error: "Music is managed by your administrator and cannot be changed here." },
    { status: 403 }
  );
}
