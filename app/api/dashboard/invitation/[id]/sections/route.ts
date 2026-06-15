import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { InvitationService } from "@/lib/services/invitation.service";
import { bustInviteCacheByInvitationId } from "@/lib/utils/invite-cache";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { type, content } = await req.json();
  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  try {
    const section = await InvitationService.addSection(id, type as string, (content ?? {}) as Record<string, unknown>, session.sub);
    await bustInviteCacheByInvitationId(id);
    return NextResponse.json({ success: true, data: section }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
