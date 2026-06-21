import { prisma } from "../db/prisma";

export class PackageService {
  static async getAll() {
    return prisma.package.findMany({ orderBy: { priceUsd: "asc" } });
  }

  static async getBySlug(slug: string) {
    return prisma.package.findUnique({ where: { slug } });
  }

  static async getUserActivePackage(userId: string) {
    return prisma.userPackage.findFirst({
      where: { userId, status: "active" },
      include: { package: true },
      orderBy: { grantedAt: "desc" },
    });
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
}
