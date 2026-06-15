import { NextRequest, NextResponse } from "next/server";
import { loginUser, COOKIE_OPTIONS } from "@/lib/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const session = await loginUser(email as string, password as string);
    const redirectTo = session.user.role === "admin" ? "/admin" : "/dashboard";

    const res = NextResponse.json({ success: true, redirectTo });
    res.cookies.set({ ...COOKIE_OPTIONS, value: session.token });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Login failed" },
      { status: 401 }
    );
  }
}
