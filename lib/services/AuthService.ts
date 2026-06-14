import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import type { JwtPayload, AuthSession } from "../../types";

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  }

  static async login(email: string, password: string): Promise<AuthSession> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    const token = this.signToken({ sub: user.id, email: user.email, role: user.role });
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    };
  }
}
