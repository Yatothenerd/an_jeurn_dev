import { NextResponse } from "next/server";

// Asset uploads are handled by the administrator through the theme editor.
// Clients do not have upload access.
export async function POST() {
  return NextResponse.json(
    { error: "Asset uploads are managed by your administrator." },
    { status: 403 }
  );
}
