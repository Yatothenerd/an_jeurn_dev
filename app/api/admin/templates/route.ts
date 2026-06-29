import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { TemplateService, type TemplateInput } from "@/lib/services/template.service";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// GET — list all templates with their package tags (Theme Builder)
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const templates = await TemplateService.list();
  return NextResponse.json({ templates });
}

// POST — create a new template
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as TemplateInput;
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }
    const template = await TemplateService.create(body);
    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
