import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { InvitationService } from "@/lib/services/invitation.service";
import { bustInviteCacheByInvitationId } from "@/lib/utils/invite-cache";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  try {
    const photo = await InvitationService.addPhoto(id, url as string, session.sub);
    await bustInviteCacheByInvitationId(id);
    return NextResponse.json({ success: true, data: photo }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
