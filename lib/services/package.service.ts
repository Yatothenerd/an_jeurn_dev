import { prisma } from "@/lib/db/prisma";
import type { Package } from "@/types";

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
  static async getAll() {
    return prisma.package.findMany({ orderBy: { priceUsd: "asc" } });
  }

  static async getBySlug(slug: string) {
    return prisma.package.findUnique({ where: { slug } });
  }

  // Returns the user's active UserPackage + Package data
  static async getClientPackage(userId: string) {
    return prisma.userPackage.findFirst({
      where: { userId, status: "active" },
      include: { package: true },
      orderBy: { grantedAt: "desc" },
    });
  }

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

  static async getUserActivePackage(userId: string) {
    return this.getClientPackage(userId);
  }
}
