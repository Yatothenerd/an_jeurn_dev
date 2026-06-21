import { NextResponse } from "next/server";

// Sections are defined by the administrator in the theme.
// Clients cannot add or modify sections.
export async function POST() {
  return NextResponse.json(
    { error: "Sections are managed by your administrator and cannot be modified here." },
    { status: 403 }
  );
}
