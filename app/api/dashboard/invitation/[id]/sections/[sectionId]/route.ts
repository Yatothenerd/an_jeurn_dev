import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { InvitationService } from "@/lib/services/invitation.service";
import { bustInviteCacheByInvitationId } from "@/lib/utils/invite-cache";

interface Params { params: Promise<{ id: string; sectionId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, sectionId } = await params;
  const body = await req.json() as { content?: Record<string, unknown>; direction?: "up" | "down" };

  try {
    if (body.direction) {
      await InvitationService.reorderSections(id, sectionId, body.direction, session.sub);
      await bustInviteCacheByInvitationId(id);
      return NextResponse.json({ success: true });
    }
    if (body.content !== undefined) {
      const section = await InvitationService.updateSection(sectionId, id, body.content, session.sub);
      await bustInviteCacheByInvitationId(id);
      return NextResponse.json({ success: true, data: section });
    }
    return NextResponse.json({ error: "content or direction required" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, sectionId } = await params;

  try {
    await InvitationService.deleteSection(sectionId, id, session.sub);
    await bustInviteCacheByInvitationId(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 403 });
  }
}
