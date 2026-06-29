import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { TemplateService, type TemplateInput } from "@/lib/services/template.service";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// GET — one template (with package tags)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const template = await TemplateService.get(id);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ template });
}

// PATCH — update design, name, active state, sort order, and/or package tags
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = (await req.json()) as Partial<TemplateInput>;
    const template = await TemplateService.update(id, body);
    return NextResponse.json({ success: true, template });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

// DELETE — remove a template (package tags cascade)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await TemplateService.remove(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
