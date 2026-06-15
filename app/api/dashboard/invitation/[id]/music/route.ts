import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { InvitationService } from "@/lib/services/invitation.service";
import { bustInviteCacheByInvitationId } from "@/lib/utils/invite-cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { musicUrl } = await req.json();

  try {
    const inv = await InvitationService.updateMusic(id, musicUrl as string | null, session.sub);
    await bustInviteCacheByInvitationId(id);
    return NextResponse.json({ success: true, data: inv });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 403 });
  }
}
