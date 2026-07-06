import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { TemplateService } from "@/lib/services/template.service";
import { bustInviteCacheByInvitationId } from "@/lib/utils/invite-cache";

// POST — snapshot a template's design onto this event's invitation
// (Design step of the event workflow). Wholesale copy; see TemplateService.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { templateId } = (await req.json()) as { templateId?: string };
  if (!templateId) return NextResponse.json({ error: "templateId required" }, { status: 400 });

  try {
    const invitation = await TemplateService.applyToEvent(templateId, id);
    await bustInviteCacheByInvitationId(invitation.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = (err as Error).message;
    const known = msg === "Template not found" || msg === "Event not found";
    if (!known) console.error(err);
    return NextResponse.json({ error: known ? msg : "Failed to apply template" }, { status: known ? 404 : 500 });
  }
}
