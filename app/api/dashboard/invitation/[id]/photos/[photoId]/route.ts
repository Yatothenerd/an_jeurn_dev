import { NextResponse } from "next/server";

// Photos and gallery assets are managed by the administrator through the theme.
// Clients cannot delete photos.
export async function DELETE() {
  return NextResponse.json(
    { error: "Photos are managed by your administrator and cannot be removed here." },
    { status: 403 }
  );
}
