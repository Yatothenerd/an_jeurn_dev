import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { TemplateService } from "@/lib/services/template.service";
import { bustInviteCacheByInvitationId } from "@/lib/utils/invite-cache";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// POST — apply a template's design to an event's invitation.
// Body: { templateId: string, eventId: string }
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { templateId, eventId } = (await req.json()) as { templateId?: string; eventId?: string };
    if (!templateId || !eventId) {
      return NextResponse.json({ error: "templateId and eventId are required" }, { status: 400 });
    }
    const invitation = await TemplateService.applyToEvent(templateId, eventId);
    await bustInviteCacheByInvitationId(invitation.id).catch(() => {});
    return NextResponse.json({ success: true, invitationId: invitation.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to apply template" }, { status: 500 });
  }
}
