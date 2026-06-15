import { prisma } from "@/lib/db/prisma";
import type { Package, PackageWithThemes } from "@/types";

type PackageFeatureFlag = keyof Pick<
  Package,
  | "hasMusic"
  | "hasVideo"
  | "hasKhqr"
  | "hasWishing"
  | "hasHosting"
  | "hasCustomThumb"
  | "hasGuestControl"
  | "hasLogo"
>;

export class PackageService {
  static async getAll(): Promise<PackageWithThemes[]> {
    return prisma.package.findMany({
      include: { packageThemes: { include: { theme: true } } },
      orderBy: { priceUsd: "asc" },
    }) as Promise<PackageWithThemes[]>;
  }

  static async getBySlug(slug: string): Promise<PackageWithThemes | null> {
    return prisma.package.findUnique({
      where: { slug },
      include: { packageThemes: { include: { theme: true } } },
    }) as Promise<PackageWithThemes | null>;
  }

  // Returns the user's active UserPackage + Package data
  static async getClientPackage(userId: string) {
    return prisma.userPackage.findFirst({
      where: { userId, status: "active" },
      include: { package: { include: { packageThemes: { include: { theme: true } } } } },
      orderBy: { grantedAt: "desc" },
    });
  }

  // Checks whether the user's active package has a given boolean feature enabled
  static async canUseFeature(userId: string, feature: PackageFeatureFlag): Promise<boolean> {
    const up = await this.getClientPackage(userId);
    if (!up) return false;
    return !!up.package[feature];
  }

  static async grantPackage(
    userId: string,
    packageId: string,
    adminId: string,
    expiresAt?: Date,
    notes?: string
  ) {
    return prisma.userPackage.create({
      data: { userId, packageId, createdBy: adminId, expiresAt, notes },
    });
  }

  // Alias used by legacy code
  static async getUserActivePackage(userId: string) {
    return this.getClientPackage(userId);
  }
}
