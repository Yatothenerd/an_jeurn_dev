import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/services/auth.service";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ name: AUTH_COOKIE, value: "", maxAge: 0, path: "/" });
  return res;
}
