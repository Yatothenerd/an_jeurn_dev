import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { GuestService } from "@/lib/services/guest.service";

async function requireGuestAccess() {
  const session = await getSession();
  if (!session || (session.role !== "client" && session.role !== "admin")) return null;
  return { userId: session.sub, isAdmin: session.role === "admin" };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; guestId: string }> }) {
  const access = await requireGuestAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, guestId } = await params;
  const body = (await req.json()) as { name?: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  try {
    const guest = await GuestService.updateGuest(guestId, id, { name: body.name.trim() }, access.userId, access.isAdmin);
    return NextResponse.json({ success: true, data: guest });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; guestId: string }> }) {
  const access = await requireGuestAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, guestId } = await params;
  try {
    await GuestService.deleteGuest(guestId, id, access.userId, access.isAdmin);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
