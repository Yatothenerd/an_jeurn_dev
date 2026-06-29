import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { TemplateService } from "@/lib/services/template.service";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// PUT — replace the set of packages this template is tagged to.
// Body: { packageIds: string[] }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const { packageIds } = (await req.json()) as { packageIds?: string[] };
    const template = await TemplateService.setPackages(id, packageIds ?? []);
    return NextResponse.json({ success: true, template });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update package tags" }, { status: 500 });
  }
}
