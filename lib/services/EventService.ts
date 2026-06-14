import { prisma } from "../db/prisma";
import type { EventWithInvitation } from "../../types";

export class EventService {
  static async getByUser(userId: string): Promise<EventWithInvitation[]> {
    return prisma.event.findMany({
      where: { userId },
      include: { invitation: true },
      orderBy: { createdAt: "desc" },
    }) as Promise<EventWithInvitation[]>;
  }

  static async getBySlug(slug: string): Promise<EventWithInvitation | null> {
    return prisma.event.findUnique({
      where: { slug },
      include: { invitation: { include: { sections: { orderBy: { sortOrder: "asc" } }, photos: { orderBy: { sortOrder: "asc" } }, theme: true } } },
    }) as Promise<EventWithInvitation | null>;
  }

  static async create(data: {
    userId: string;
    title: string;
    eventType: string;
    eventDate: Date;
    venueName?: string;
    venueMapUrl?: string;
    slug: string;
  }) {
    return prisma.event.create({ data });
  }
}
