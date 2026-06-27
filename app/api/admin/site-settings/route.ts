import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/services/auth.service";
import {
  getSiteSettings,
  saveSiteSettings,
  ENTRANCE_STYLES,
  TRANSITION_STYLES,
  type EntranceStyle,
  type TransitionStyle,
} from "@/lib/services/site-settings.service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getSiteSettings());
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const patch: { entranceStyle?: EntranceStyle; transitionStyle?: TransitionStyle } = {};

    if (body.entranceStyle !== undefined) {
      if (!ENTRANCE_STYLES.includes(body.entranceStyle)) {
        return NextResponse.json({ error: "Invalid entranceStyle" }, { status: 400 });
      }
      patch.entranceStyle = body.entranceStyle;
    }
    if (body.transitionStyle !== undefined) {
      if (!TRANSITION_STYLES.includes(body.transitionStyle)) {
        return NextResponse.json({ error: "Invalid transitionStyle" }, { status: 400 });
      }
      patch.transitionStyle = body.transitionStyle;
    }

    const next = await saveSiteSettings(patch);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
