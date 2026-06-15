import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCachedInvite, setCachedInvite, type InviteData } from "@/lib/utils/invite-cache";
import { CoverSection } from "./_components/sections/CoverSection";
import { CountdownSection } from "./_components/sections/CountdownSection";
import { AgendaSection } from "./_components/sections/AgendaSection";
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
    bg: "#f9f7f4", cardBg: "#ffffff", primary: "#b76e79", accent: "#d4af37",
    text: "#4a3728", muted: "#8a7560", border: "#e6d9bf", btnBg: "#800020", btnText: "#f9f7f4",
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

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const { slug } = await params;
  const data = await loadInviteData(slug);

  if (!data || !data.invitation.isPublished) notFound();

  const theme = getTheme(data.invitation.themeId);

  // Personalized guest name from the per-guest link (?g=<token>). Looked up
  // outside the cached invite payload so it's always fresh per visitor.
  const { g } = await searchParams;
  let guestName: string | null = null;
  if (g) {
    const guest = await prisma.guest.findFirst({
      where: { token: g, eventId: data.event.id },
      select: { name: true },
    });
    guestName = guest?.name ?? null;
  }

  // Royal Khmer renders ornate gold corner frames on every section.
  const ornate = data.invitation.themeId === "theme-royal-khmer";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #e7e3dc; }
        img { max-width: 100%; }
        .invite-shell {
          background: ${theme.bg};
          min-height: 100vh;
          max-width: 430px;
          margin: 0 auto;
          padding-bottom: 7rem;
          position: relative;
          box-shadow: 0 0 40px rgba(0,0,0,0.18);
        }
        .sec-frame { position: relative; }
        .sec-frame > .sec-corner {
          position: absolute;
          width: 46px; height: 58px;
          background: ${theme.accent};
          -webkit-mask: url('/themes/khmer/corner.png') center / contain no-repeat;
          mask: url('/themes/khmer/corner.png') center / contain no-repeat;
          pointer-events: none; opacity: 0.9; z-index: 5;
        }
        .sec-corner.tl { top: 8px; left: 8px; }
        .sec-corner.tr { top: 8px; right: 8px; transform: scaleX(-1); }
        .sec-corner.bl { bottom: 8px; left: 8px; transform: scaleY(-1); }
        .sec-corner.br { bottom: 8px; right: 8px; transform: scale(-1); }
        @media (max-width: 480px) {
          body { font-size: 16px; }
        }
      ` }} />

      <div className="invite-shell">
        {/* Sections */}
        {data.sections.map((sec) => {
          const c = sec.content as Record<string, unknown>;
          let node: React.ReactNode = null;

          if (sec.type === "cover") {
            node = (
              <CoverSection
                content={c as { heading?: string; subheading?: string; guestLabel?: string }}
                eventTitle={data.event.title}
                eventDate={data.event.eventDate}
                guestName={guestName}
                theme={theme}
              />
            );
          } else if (sec.type === "countdown") {
            node = (
              <CountdownSection
                targetDate={(c.targetDate as string) ?? ""}
                label={c.label as string | undefined}
                eventDate={data.event.eventDate}
                theme={theme}
              />
            );
          } else if (sec.type === "agenda") {
            node = (
              <AgendaSection
                content={c as { title?: string; subtitle?: string; items?: { time?: string; timeEn?: string; title?: string; icon?: number | string }[] }}
                theme={theme}
              />
            );
          } else if (sec.type === "details") {
            node = (
              <DetailsSection
                content={c as { items?: { icon: string; label: string; value: string }[] }}
                venueName={data.event.venueName}
                venueMapUrl={data.event.venueMapUrl}
                theme={theme}
              />
            );
          } else if (sec.type === "gallery") {
            node = (
              <GallerySection
                content={c as { layout?: string }}
                photos={data.photos}
                theme={theme}
              />
            );
          } else if (sec.type === "video") {
            node = (
              <VideoSection
                content={c as { url?: string; caption?: string }}
                theme={theme}
              />
            );
          } else if (sec.type === "khqr") {
            node = (
              <KhqrSection
                content={c as { recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string }}
                theme={theme}
              />
            );
          } else if (sec.type === "wishing" && data.pkg?.hasWishing) {
            node = (
              <WishingSection
                invitationId={data.invitation.id}
                initialWishes={data.wishes}
                content={c as { placeholder?: string }}
                theme={theme}
              />
            );
          }

          if (!node) return null;
          if (!ornate) return <div key={sec.id}>{node}</div>;
          return (
            <div key={sec.id} className="sec-frame">
              {node}
              <span className="sec-corner tl" />
              <span className="sec-corner tr" />
              <span className="sec-corner bl" />
              <span className="sec-corner br" />
            </div>
          );
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
