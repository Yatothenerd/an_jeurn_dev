import { redis } from "@/lib/db/redis";
import { prisma } from "@/lib/db/prisma";

const TTL    = 600; // 10 minutes
const key    = (slug: string) => `invite:${slug}`;
const verKey = (slug: string) => `invite-ver:${slug}`;

export type InviteWish = {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
};

// All design fields live directly on Invitation — no separate Theme model.
export type InviteData = {
  event: {
    id: string;
    title: string;
    eventType: string;
    eventDate: string;
    venueName: string | null;
    venueMapUrl: string | null;
    slug: string;
  };
  invitation: {
    id: string;
    contentType: string | null;
    defaultSections: unknown;
    overlayConfig: Record<string, unknown> | null;
    backgroundUrl: string | null;
    backgroundVideoUrl: string | null;
    coverUrl: string | null;
    musicUrl: string | null;
    thumbnailUrl: string | null;
    shareLink: string | null;
    showWatermark: boolean;
    isPublished: boolean;
    isAnimated: boolean;
  };
  sections: Array<{ id: string; type: string; sortOrder: number; content: unknown }>;
  photos: Array<{ id: string; url: string; sortOrder: number }>;
  pkg: {
    hasWishing: boolean;
    hasGuestControl: boolean;
    hasMusic: boolean;
    hasKhqr: boolean;
    hasLocation: boolean;
    hasOpeningCover: boolean;
    hasWatermark: boolean;
    galleryType: string | null;
  } | null;
  wishes: InviteWish[];
};

export async function getCachedInvite(slug: string): Promise<InviteData | null> {
  try {
    const raw = await redis.get<InviteData>(key(slug));
    return raw ?? null;
  } catch {
    return null;
  }
}

export async function setCachedInvite(slug: string, data: InviteData): Promise<void> {
  try {
    await redis.set(key(slug), data, { ex: TTL });
  } catch {
    // non-fatal
  }
}

export async function bustInviteCache(slug: string): Promise<void> {
  try {
    await Promise.all([
      redis.del(key(slug)),
      redis.set(verKey(slug), Date.now(), { ex: 86400 }),
    ]);
  } catch {
    // non-fatal
  }
}

export async function getInviteVersion(slug: string): Promise<number> {
  try {
    const v = await redis.get<number>(verKey(slug));
    return v ?? 0;
  } catch {
    return 0;
  }
}

export async function bustInviteCacheByInvitationId(invitationId: string): Promise<void> {
  try {
    const row = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { event: { select: { slug: true } } },
    });
    if (row?.event?.slug) await bustInviteCache(row.event.slug);
  } catch {
    // non-fatal
  }
}
