import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import { uploadToCloudinary } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    const sub = ((fd.get("folder") as string | null) ?? "uploads").replace(/[^a-zA-Z0-9_-]/g, "");
    const folder = `an_jeurn/_admin/${sub}`;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const url = await uploadToCloudinary(file, folder);
    return NextResponse.json({ success: true, url });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
