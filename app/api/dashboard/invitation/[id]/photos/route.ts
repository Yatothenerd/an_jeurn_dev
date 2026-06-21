import { NextResponse } from "next/server";

// Photos and gallery assets are managed by the administrator through the theme.
// Clients cannot upload or modify photos.
export async function POST() {
  return NextResponse.json(
    { error: "Photos are managed by your administrator and cannot be modified here." },
    { status: 403 }
  );
}
