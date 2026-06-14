import { prisma } from "../db/prisma";
import type { Theme } from "../../types";

export class ThemeService {
  static async getAll(): Promise<Theme[]> {
    return prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  static async getById(id: string): Promise<Theme | null> {
    return prisma.theme.findUnique({ where: { id } });
  }

  static async getByPackage(packageId: string): Promise<Theme[]> {
    const rows = await prisma.packageTheme.findMany({
      where: { packageId },
      include: { theme: true },
      orderBy: { theme: { sortOrder: "asc" } },
    });
    return rows.map((r) => r.theme);
  }
}
