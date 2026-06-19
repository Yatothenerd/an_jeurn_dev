import { prisma } from "@/lib/db/prisma";
import { shortToken } from "@/lib/utils/token";

interface RsvpData {
  name: string;
  contact?: string;
  contactType?: string;
  mealPref?: string;
  rsvpStatus: "attending" | "declined";
}

interface AddGuestData {
  name: string;
  contact?: string;
  contactType?: string;
}

export class GuestService {
  // Admin controls every event, so access is granted to the owning client OR
  // any admin. Non-admins must own the event.
  private static async verifyEventAccess(eventId: string, userId: string, isAdmin = false) {
    const event = isAdmin
      ? await prisma.event.findUnique({ where: { id: eventId } })
      : await prisma.event.findFirst({ where: { id: eventId, userId } });
    if (!event) throw new Error("Event not found");
    return event;
  }

  static async getGuestsForEvent(eventId: string, userId: string, isAdmin = false) {
    await this.verifyEventAccess(eventId, userId, isAdmin);
    return prisma.guest.findMany({
      where: { eventId },
      orderBy: [{ rsvpStatus: "asc" }, { name: "asc" }],
    });
  }

  static async addGuest(eventId: string, data: AddGuestData, userId: string, isAdmin = false) {
    const event = await this.verifyEventAccess(eventId, userId, isAdmin);

    // Guest limit comes from the event owner's active package (not the actor —
    // an admin adding guests must still respect the client's package).
    const userPkg = await prisma.userPackage.findFirst({
      where: { userId: event.userId, status: "active" },
      include: { package: true },
      orderBy: { grantedAt: "desc" },
    });
    if (userPkg) {
      const count = await prisma.guest.count({ where: { eventId } });
      if (count >= userPkg.package.maxGuests) {
        throw new Error(`Guest limit reached (max ${userPkg.package.maxGuests})`);
      }
    }

    return prisma.guest.create({
      data: {
        eventId,
        token: shortToken(),
        name: data.name,
        contact: data.contact,
        contactType: data.contactType as "email" | "phone" | "whatsapp" | undefined,
      },
    });
  }

  // Rename a guest. Used both by the client and by admins moderating improper
  // names entered on the guest list.
  static async updateGuest(
    guestId: string,
    eventId: string,
    data: { name: string },
    userId: string,
    isAdmin = false
  ) {
    await this.verifyEventAccess(eventId, userId, isAdmin);
    return prisma.guest.update({ where: { id: guestId, eventId }, data: { name: data.name } });
  }

  static async deleteGuest(guestId: string, eventId: string, userId: string, isAdmin = false) {
    await this.verifyEventAccess(eventId, userId, isAdmin);
    await prisma.guest.delete({ where: { id: guestId, eventId } });
  }

  static async submitRSVP(eventId: string, data: RsvpData) {
    // Check if this event's owner package requires guest control
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        user: {
          include: {
            userPackages: {
              where: { status: "active" },
              include: { package: true },
              orderBy: { grantedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });
    if (!event) throw new Error("Event not found");

    const activePkg = event.user.userPackages[0]?.package;

    if (activePkg?.hasGuestControl) {
      // Must match a pre-registered guest by name (case-insensitive)
      const existing = await prisma.guest.findFirst({
        where: {
          eventId,
          name: { equals: data.name, mode: "insensitive" },
        },
      });
      if (!existing) throw new Error("You are not on the guest list for this event.");

      // Update existing guest row
      return prisma.guest.update({
        where: { id: existing.id },
        data: {
          contact: data.contact,
          contactType: data.contactType as "email" | "phone" | "whatsapp" | undefined,
          mealPref: data.mealPref,
          rsvpStatus: data.rsvpStatus,
          rsvpAt: new Date(),
        },
      });
    }

    // Free RSVP — upsert by name
    const existing = await prisma.guest.findFirst({
      where: { eventId, name: { equals: data.name, mode: "insensitive" } },
    });
    if (existing) {
      return prisma.guest.update({
        where: { id: existing.id },
        data: {
          contact: data.contact,
          contactType: data.contactType as "email" | "phone" | "whatsapp" | undefined,
          mealPref: data.mealPref,
          rsvpStatus: data.rsvpStatus,
          rsvpAt: new Date(),
        },
      });
    }

    return prisma.guest.create({
      data: {
        eventId,
        token: shortToken(),
        name: data.name,
        contact: data.contact,
        contactType: data.contactType as "email" | "phone" | "whatsapp" | undefined,
        mealPref: data.mealPref,
        rsvpStatus: data.rsvpStatus,
        rsvpAt: new Date(),
      },
    });
  }

  static async toCSV(eventId: string, userId: string, isAdmin = false): Promise<string> {
    const guests = await this.getGuestsForEvent(eventId, userId, isAdmin);
    const header = "Name,Contact,Contact Type,RSVP Status,Meal Preference,RSVP At\n";
    const rows = guests
      .map(
        (g) =>
          [g.name, g.contact ?? "", g.contactType ?? "", g.rsvpStatus ?? "", g.mealPref ?? "", g.rsvpAt?.toISOString() ?? ""]
            .map((v) => `"${v.replace(/"/g, '""')}"`)
            .join(",")
      )
      .join("\n");
    return header + rows;
  }
}
