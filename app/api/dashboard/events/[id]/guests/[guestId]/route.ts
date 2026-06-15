import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { GuestService } from "@/lib/services/guest.service";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; guestId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, guestId } = await params;
  try {
    await GuestService.deleteGuest(guestId, id, session.sub);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
