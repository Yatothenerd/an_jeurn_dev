import { Prisma } from "../../app/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { PackageService } from "@/lib/services/package.service";

export class InvitationService {
  private static async verifyOwnership(invitationId: string, userId: string) {
    const inv = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { event: { select: { userId: true } } },
    });
    if (!inv || inv.event.userId !== userId) throw new Error("Not found");
    return inv;
  }

  static async createInvitation(eventId: string, themeId: string, userId: string) {
    const event = await prisma.event.findFirst({ where: { id: eventId, userId } });
    if (!event) throw new Error("Event not found");

    const existing = await prisma.invitation.findUnique({ where: { eventId } });
    if (existing) return existing;

    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${event.slug}`;
    return prisma.invitation.create({ data: { eventId, themeId, shareLink } });
  }

  static async updateTheme(invitationId: string, themeId: string, userId: string) {
    await this.verifyOwnership(invitationId, userId);
    return prisma.invitation.update({ where: { id: invitationId }, data: { themeId } });
  }

  static async addSection(
    invitationId: string,
    type: string,
    content: Record<string, unknown>,
    userId: string
  ) {
    await this.verifyOwnership(invitationId, userId);

    const pkg = await PackageService.getClientPackage(userId);
    if (pkg) {
      const count = await prisma.section.count({ where: { invitationId } });
      if (count >= pkg.package.maxSections) {
        throw new Error(`Section limit reached (max ${pkg.package.maxSections})`);
      }
    }

    const last = await prisma.section.findFirst({
      where: { invitationId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    return prisma.section.create({
      data: { invitationId, type, content: content as Prisma.InputJsonValue, sortOrder: (last?.sortOrder ?? 0) + 1 },
    });
  }

  static async updateSection(
    sectionId: string,
    invitationId: string,
    content: Record<string, unknown>,
    userId: string
  ) {
    await this.verifyOwnership(invitationId, userId);
    return prisma.section.update({
      where: { id: sectionId, invitationId },
      data: { content: content as Prisma.InputJsonValue },
    });
  }

  static async reorderSections(
    invitationId: string,
    sectionId: string,
    direction: "up" | "down",
    userId: string
  ) {
    await this.verifyOwnership(invitationId, userId);

    const sections = await prisma.section.findMany({
      where: { invitationId },
      orderBy: { sortOrder: "asc" },
    });

    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;

    const a = sections[idx];
    const b = sections[swapIdx];

    await prisma.$transaction([
      prisma.section.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      prisma.section.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  }

  static async deleteSection(sectionId: string, invitationId: string, userId: string) {
    await this.verifyOwnership(invitationId, userId);
    await prisma.section.delete({ where: { id: sectionId, invitationId } });
  }

  static async addPhoto(invitationId: string, url: string, userId: string) {
    await this.verifyOwnership(invitationId, userId);

    const pkg = await PackageService.getClientPackage(userId);
    if (pkg) {
      const count = await prisma.photo.count({ where: { invitationId } });
      if (count >= pkg.package.maxPhotos) {
        throw new Error(`Photo limit reached (max ${pkg.package.maxPhotos})`);
      }
    }

    const last = await prisma.photo.findFirst({
      where: { invitationId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    return prisma.photo.create({
      data: { invitationId, url, sortOrder: (last?.sortOrder ?? 0) + 1 },
    });
  }

  static async deletePhoto(photoId: string, invitationId: string, userId: string) {
    await this.verifyOwnership(invitationId, userId);
    await prisma.photo.delete({ where: { id: photoId, invitationId } });
  }

  static async updateMusic(invitationId: string, musicUrl: string | null, userId: string) {
    await this.verifyOwnership(invitationId, userId);
    return prisma.invitation.update({ where: { id: invitationId }, data: { musicUrl } });
  }

  static async updateSettings(
    invitationId: string,
    data: { isPublished?: boolean },
    userId: string
  ) {
    const inv = await this.verifyOwnership(invitationId, userId);

    if (data.isPublished) {
      const pkg = await PackageService.getClientPackage(userId);
      if (pkg && !pkg.package.hasHosting) {
        throw new Error("Your package does not include hosting");
      }
      // Generate share link if missing
      if (!inv.shareLink) {
        const event = await prisma.event.findUnique({ where: { id: inv.eventId } });
        const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${event?.slug}`;
        await prisma.invitation.update({ where: { id: invitationId }, data: { shareLink } });
      }
    }

    return prisma.invitation.update({ where: { id: invitationId }, data });
  }
}
