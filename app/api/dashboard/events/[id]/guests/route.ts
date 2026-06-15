import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { GuestService } from "@/lib/services/guest.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const guests = await GuestService.getGuestsForEvent(id, session.sub);
    return NextResponse.json({ success: true, data: guests });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 403 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as { name?: string; contact?: string; contactType?: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  try {
    const guest = await GuestService.addGuest(id, { name: body.name!, contact: body.contact, contactType: body.contactType }, session.sub);
    return NextResponse.json({ success: true, data: guest }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
