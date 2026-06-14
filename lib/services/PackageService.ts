import { prisma } from "../db/prisma";
import type { PackageWithThemes } from "../../types";

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

  static async getUserActivePackage(userId: string) {
    return prisma.userPackage.findFirst({
      where: { userId, status: "active" },
      include: { package: { include: { packageThemes: { include: { theme: true } } } } },
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
