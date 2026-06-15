import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCachedInvite, setCachedInvite, type InviteData } from "@/lib/utils/invite-cache";
import { CoverSection } from "./_components/sections/CoverSection";
import { CountdownSection } from "./_components/sections/CountdownSection";
import { DetailsSection } from "./_components/sections/DetailsSection";
import { GallerySection } from "./_components/sections/GallerySection";
import { VideoSection } from "./_components/sections/VideoSection";
import { KhqrSection } from "./_components/sections/KhqrSection";
import { WishingSection } from "./_components/sections/WishingSection";
import { RsvpModal } from "./_components/RsvpModal";
import { MusicPlayer } from "./_components/MusicPlayer";
import { Watermark } from "./_components/Watermark";

// ── Theme palette map ─────────────────────────────────────────────────────────

type ThemeStyle = {
  bg: string; cardBg: string; primary: string; accent: string;
  text: string; muted: string; border: string; btnBg: string; btnText: string;
  font: string;
};

const THEME_STYLES: Record<string, ThemeStyle> = {
  "theme-classic-white": {
    bg: "#FFFFFF", cardBg: "#F8F6F2", primary: "#1a1a1a", accent: "#8B7355",
    text: "#2D2D2D", muted: "#6B6B6B", border: "#E8E4DC", btnBg: "#1a1a1a", btnText: "#FFFFFF",
    font: "Georgia, 'Times New Roman', serif",
  },
  "theme-navy-toile": {
    bg: "#F5F1E8", cardBg: "#ECE5D6", primary: "#1F3A5F", accent: "#2C4A6E",
    text: "#1A2A40", muted: "#5A6B82", border: "#C9D2DE", btnBg: "#1F3A5F", btnText: "#F5F1E8",
    font: "Georgia, 'Times New Roman', serif",
  },
  "theme-rose-garden": {
    bg: "#F8E9EC", cardBg: "#FBEEF0", primary: "#5A1A2E", accent: "#A8455E",
    text: "#3D1320", muted: "#8A5566", border: "#ECC9D1", btnBg: "#6E1F3A", btnText: "#FBEEF0",
    font: "Georgia, 'Times New Roman', serif",
  },
  "theme-vintage-lace": {
    bg: "#34251B", cardBg: "#3C2A1E", primary: "#F3E9D6", accent: "#C9A86A",
    text: "#F0E6D2", muted: "#B89C7A", border: "#5A4636", btnBg: "#C9A86A", btnText: "#2A1E16",
    font: "Georgia, 'Times New Roman', serif",
  },
  "theme-cocoa-doily": {
    bg: "#F3EAD6", cardBg: "#ECE0C8", primary: "#3A2A1E", accent: "#8B6F4E",
    text: "#2E2018", muted: "#7A6450", border: "#E2D4BC", btnBg: "#3A2A1E", btnText: "#F3EAD6",
    font: "Georgia, 'Times New Roman', serif",
  },
  "theme-champagne-noir": {
    bg: "#0A0A0A", cardBg: "#1A1A1A", primary: "#F5E6C8", accent: "#D4AF37",
    text: "#F5E6C8", muted: "#9A8B6A", border: "#2E2A1A", btnBg: "#D4AF37", btnText: "#0A0A0A",
    font: "Georgia, 'Times New Roman', serif",
  },
  "theme-olive-arch": {
    bg: "#F1EEE3", cardBg: "#E6E1D0", primary: "#404A1C", accent: "#6B7A35",
    text: "#2E3416", muted: "#6E7458", border: "#D2CDB8", btnBg: "#4A5320", btnText: "#F1EEE3",
    font: "Georgia, 'Times New Roman', serif",
  },
  "theme-royal-khmer": {
    bg: "#5A0016", cardBg: "#6E0A22", primary: "#F5E6C8", accent: "#D4AF37",
    text: "#F3E3C6", muted: "#C9A98A", border: "#7A1A30", btnBg: "#D4AF37", btnText: "#5A0016",
    font: "Georgia, 'Times New Roman', serif",
  },
};

const DEFAULT_THEME: ThemeStyle = THEME_STYLES["theme-classic-white"];

function getTheme(themeId: string): ThemeStyle {
  return THEME_STYLES[themeId] ?? DEFAULT_THEME;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadInviteData(slug: string): Promise<InviteData | null> {
  // Try Redis cache first
  const cached = await getCachedInvite(slug);
  if (cached) return cached;

  // Miss — query DB
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      invitation: {
        include: {
          theme: true,
          sections: { orderBy: { sortOrder: "asc" } },
          photos: { orderBy: { sortOrder: "asc" } },
          wishes: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
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

  if (!event || !event.invitation) return null;
  const inv = event.invitation;
  const pkg = event.user.userPackages[0]?.package ?? null;

  const data: InviteData = {
    event: {
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      eventDate: event.eventDate.toISOString(),
      venueName: event.venueName,
      venueMapUrl: event.venueMapUrl,
      slug: event.slug,
    },
    invitation: {
      id: inv.id,
      themeId: inv.themeId,
      musicUrl: inv.musicUrl,
      shareLink: inv.shareLink,
      showWatermark: inv.showWatermark,
      isPublished: inv.isPublished,
    },
    theme: { id: inv.theme.id, name: inv.theme.name },
    sections: inv.sections.map((s) => ({ id: s.id, type: s.type, sortOrder: s.sortOrder, content: s.content })),
    photos: inv.photos.map((p) => ({ id: p.id, url: p.url, sortOrder: p.sortOrder })),
    pkg: pkg ? { hasWishing: pkg.hasWishing, hasGuestControl: pkg.hasGuestControl, galleryType: pkg.galleryType } : null,
    wishes: inv.wishes.map((w) => ({ id: w.id, guestName: w.guestName, message: w.message, createdAt: w.createdAt.toISOString() })),
  };

  await setCachedInvite(slug, data);
  return data;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadInviteData(slug);
  if (!data) return { title: "Invitation" };
  return {
    title: data.event.title,
    description: `You're invited to ${data.event.title}`,
    openGraph: {
      title: data.event.title,
      description: `You're invited to ${data.event.title}`,
      type: "website",
    },
  };
}

export default async function InvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadInviteData(slug);

  if (!data || !data.invitation.isPublished) notFound();

  const theme = getTheme(data.invitation.themeId);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: ${theme.bg}; }
        img { max-width: 100%; }
        @media (max-width: 480px) {
          body { font-size: 16px; }
        }
      `}</style>

      <div style={{ background: theme.bg, minHeight: "100vh", maxWidth: "480px", margin: "0 auto", paddingBottom: "7rem" }}>
        {/* Sections */}
        {data.sections.map((sec) => {
          const c = sec.content as Record<string, unknown>;
          if (sec.type === "cover") {
            return (
              <CoverSection
                key={sec.id}
                content={c as { heading?: string; subheading?: string }}
                eventTitle={data.event.title}
                eventDate={data.event.eventDate}
                theme={theme}
              />
            );
          }
          if (sec.type === "countdown") {
            return (
              <CountdownSection
                key={sec.id}
                targetDate={(c.targetDate as string) ?? ""}
                label={c.label as string | undefined}
                eventDate={data.event.eventDate}
                theme={theme}
              />
            );
          }
          if (sec.type === "details") {
            return (
              <DetailsSection
                key={sec.id}
                content={c as { items?: { icon: string; label: string; value: string }[] }}
                venueName={data.event.venueName}
                venueMapUrl={data.event.venueMapUrl}
                theme={theme}
              />
            );
          }
          if (sec.type === "gallery") {
            return (
              <GallerySection
                key={sec.id}
                content={c as { layout?: string }}
                photos={data.photos}
                theme={theme}
              />
            );
          }
          if (sec.type === "video") {
            return (
              <VideoSection
                key={sec.id}
                content={c as { url?: string; caption?: string }}
                theme={theme}
              />
            );
          }
          if (sec.type === "khqr") {
            return (
              <KhqrSection
                key={sec.id}
                content={c as { recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string }}
                theme={theme}
              />
            );
          }
          if (sec.type === "wishing" && data.pkg?.hasWishing) {
            return (
              <WishingSection
                key={sec.id}
                invitationId={data.invitation.id}
                initialWishes={data.wishes}
                content={c as { placeholder?: string }}
                theme={theme}
              />
            );
          }
          return null;
        })}

        {/* RSVP button + modal */}
        <RsvpModal
          eventId={data.event.id}
          hasGuestControl={data.pkg?.hasGuestControl ?? false}
          theme={theme}
        />

        {/* Background music */}
        {data.invitation.musicUrl && (
          <MusicPlayer musicUrl={data.invitation.musicUrl} theme={theme} />
        )}

        {/* Powered-by watermark */}
        {data.invitation.showWatermark && <Watermark />}
      </div>
    </>
  );
}
