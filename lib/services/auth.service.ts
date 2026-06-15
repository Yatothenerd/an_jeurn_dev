import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import type { JwtPayload, AuthSession } from "@/types";

const SALT_ROUNDS = 12;
export const AUTH_COOKIE = "auth_token";

export const COOKIE_OPTIONS = {
  name: AUTH_COOKIE,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateJWT(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });
}

export function verifyJWT(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
}

// For use in server components and API routes (Node.js runtime only)
export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifyJWT(token);
  } catch {
    return null;
  }
}

export async function loginUser(email: string, password: string): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  const token = generateJWT({ sub: user.id, email: user.email, role: user.role });
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
}
