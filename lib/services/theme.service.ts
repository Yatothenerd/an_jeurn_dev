import { prisma } from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import type { Theme } from "@/types";

const CACHE_TTL = 3600; // 1 hour

function cacheKey(packageId: string) {
  return `themes:package:${packageId}`;
}

export class ThemeService {
  // All themes (admin use — includes inactive)
  static async getAllThemes(): Promise<Theme[]> {
    return prisma.theme.findMany({ orderBy: { sortOrder: "asc" } });
  }

  static async getById(id: string): Promise<Theme | null> {
    return prisma.theme.findUnique({ where: { id } });
  }

  // Active themes for a package (with Redis cache)
  static async getThemesForPackage(packageId: string): Promise<Theme[]> {
    const key = cacheKey(packageId);
    const cached = await redis.get<Theme[]>(key);
    if (cached) return cached;

    const rows = await prisma.packageTheme.findMany({
      where: { packageId, theme: { isActive: true } },
      include: { theme: true },
      orderBy: { theme: { sortOrder: "asc" } },
    });
    const themes = rows.map((r: { theme: Theme }) => r.theme);
    await redis.set(key, themes, { ex: CACHE_TTL });
    return themes;
  }

  // Themes granted exclusively to one event (bespoke / admin-designed), active only.
  static async getExclusiveThemesForEvent(eventId: string): Promise<Theme[]> {
    const rows = await prisma.eventTheme.findMany({
      where: { eventId, theme: { isActive: true } },
      include: { theme: true },
      orderBy: { theme: { sortOrder: "asc" } },
    });
    return rows.map((r: { theme: Theme }) => r.theme);
  }

  // Full theme picker for an event: the client's package pool PLUS any themes
  // assigned exclusively to this event, de-duplicated.
  static async getAllowedThemesForEvent(eventId: string, packageId: string | null): Promise<Theme[]> {
    const [pool, exclusive] = await Promise.all([
      packageId ? this.getThemesForPackage(packageId) : Promise.resolve([] as Theme[]),
      this.getExclusiveThemesForEvent(eventId),
    ]);
    const byId = new Map<string, Theme>();
    for (const t of pool) byId.set(t.id, t);
    for (const t of exclusive) byId.set(t.id, t);
    return Array.from(byId.values());
  }

  static async assignThemeToEvent(themeId: string, eventId: string): Promise<void> {
    await prisma.eventTheme.upsert({
      where: { eventId_themeId: { eventId, themeId } },
      create: { eventId, themeId },
      update: {},
    });
  }

  static async releaseThemeFromEvent(themeId: string, eventId: string): Promise<void> {
    await prisma.eventTheme
      .delete({ where: { eventId_themeId: { eventId, themeId } } })
      .catch(() => undefined); // ignore if not found
  }

  // Active themes available to a specific client (resolved via their active package)
  static async getAllowedThemesForClient(userId: string): Promise<Theme[]> {
    const up = await prisma.userPackage.findFirst({
      where: { userId, status: "active" },
      orderBy: { grantedAt: "desc" },
      select: { packageId: true },
    });
    if (!up) return [];
    return this.getThemesForPackage(up.packageId);
  }

  static async assignThemeToPackage(themeId: string, packageId: string): Promise<void> {
    await prisma.packageTheme.upsert({
      where: { packageId_themeId: { packageId, themeId } },
      create: { packageId, themeId },
      update: {},
    });
    await this.bustCache(packageId);
  }

  static async removeThemeFromPackage(themeId: string, packageId: string): Promise<void> {
    await prisma.packageTheme.delete({
      where: { packageId_themeId: { packageId, themeId } },
    }).catch(() => undefined); // ignore if not found
    await this.bustCache(packageId);
  }

  // Replaces all theme assignments for a package in one operation
  static async setThemesForPackage(packageId: string, themeIds: string[]): Promise<void> {
    await prisma.$transaction([
      prisma.packageTheme.deleteMany({ where: { packageId } }),
      prisma.packageTheme.createMany({
        data: themeIds.map((themeId) => ({ packageId, themeId })),
        skipDuplicates: true,
      }),
    ]);
    await this.bustCache(packageId);
  }

  static async toggleActive(id: string, isActive: boolean): Promise<Theme> {
    return prisma.theme.update({ where: { id }, data: { isActive } });
  }

  private static async bustCache(packageId: string): Promise<void> {
    await redis.del(cacheKey(packageId));
  }
}
