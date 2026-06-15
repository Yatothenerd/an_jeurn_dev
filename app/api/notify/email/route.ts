// QStash webhook handler — receives queued email jobs and delivers via SendGrid
import { NextRequest, NextResponse } from "next/server";
import { NotifyService } from "@/lib/services/notify.service";

export async function POST(req: NextRequest) {
  // Basic secret validation — set NOTIFY_SECRET env var
  const secret = process.env.NOTIFY_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { to, subject, html } = await req.json() as { to?: string; subject?: string; html?: string };
  if (!to || !subject || !html) {
    return NextResponse.json({ error: "to, subject and html are required" }, { status: 400 });
  }

  await NotifyService.sendEmailDirect(to, subject, html);
  return NextResponse.json({ success: true });
}
