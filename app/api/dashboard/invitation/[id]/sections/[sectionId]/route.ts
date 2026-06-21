import { NextResponse } from "next/server";

// Sections are defined by the administrator in the theme.
// Clients cannot edit or delete sections.
export async function PATCH() {
  return NextResponse.json(
    { error: "Sections are managed by your administrator and cannot be modified here." },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Sections are managed by your administrator and cannot be removed here." },
    { status: 403 }
  );
}
