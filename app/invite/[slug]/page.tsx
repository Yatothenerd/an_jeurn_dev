import { Fragment } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCachedInvite, setCachedInvite, type InviteData } from "@/lib/utils/invite-cache";
import { getTheme, buildInviteCss, buildFontsHref, standardLayout } from "@/lib/themes/registry";
import type { SectionComponents, SectionType, ThemeTokens } from "@/lib/themes/types";
import { CoverSection } from "./_components/sections/CoverSection";
import { CountdownSection } from "./_components/sections/CountdownSection";
import { AgendaSection } from "./_components/sections/AgendaSection";
import { DetailsSection } from "./_components/sections/DetailsSection";
import { GallerySection } from "./_components/sections/GallerySection";
import { VideoSection } from "./_components/sections/VideoSection";
import { KhqrSection } from "./_components/sections/KhqrSection";
import { WishingSection } from "./_components/sections/WishingSection";
import { ImageSection } from "./_components/sections/ImageSection";
import { GuestlistSection } from "./_components/sections/GuestlistSection";
import { RsvpModal } from "./_components/RsvpModal";
import { InviteActions } from "./_components/InviteActions";
import { Watermark } from "./_components/Watermark";
import { InviteGate } from "./_components/InviteGate";

// Default section renderers (the shared `.inv-*` design system). A theme may
// override any of these via its `sections` map; unspecified sections fall back
// to these.
const STANDARD_SECTIONS = {
  cover: CoverSection,
  countdown: CountdownSection,
  agenda: AgendaSection,
  details: DetailsSection,
  gallery: GallerySection,
  video: VideoSection,
  khqr: KhqrSection,
  wishing: WishingSection,
  image: ImageSection,
  guestlist: GuestlistSection,
} satisfies SectionComponents;

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadInviteData(slug: string): Promise<InviteData | null> {
  const cached = await getCachedInvite(slug);
  if (cached) return cached;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      invitation: {
        include: {
          theme: true,
          sections: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } },
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
      thumbnailUrl: inv.thumbnailUrl,
      backgroundUrl: inv.backgroundUrl,
      musicUrl: inv.musicUrl,
      shareLink: inv.shareLink,
      showWatermark: inv.showWatermark,
      isPublished: inv.isPublished,
    },
    theme: { id: inv.theme.id, name: inv.theme.name },
    sections: inv.sections.map((s) => ({ id: s.id, type: s.type, sortOrder: s.sortOrder, content: s.content })),
    photos: inv.photos.map((p) => ({ id: p.id, url: p.url, sortOrder: p.sortOrder })),
    pkg: pkg
      ? {
          hasWishing: pkg.hasWishing,
          hasGuestControl: pkg.hasGuestControl,
          hasMusic: pkg.hasMusic,
          hasKhqr: pkg.hasKhqr,
          hasLocation: pkg.hasLocation,
          hasOpeningCover: pkg.hasOpeningCover,
          hasWatermark: pkg.hasWatermark,
          galleryType: pkg.galleryType,
        }
      : null,
    wishes: inv.wishes.map((w) => ({ id: w.id, guestName: w.guestName, message: w.message, createdAt: w.createdAt.toISOString() })),
  };

  await setCachedInvite(slug, data);
  return data;
}

// ── Section rendering ───────────────────────────────────────────────────────────

function renderSection(
  sec: InviteData["sections"][number],
  data: InviteData,
  tokens: ThemeTokens,
  components: SectionComponents,
  assets: Record<string, string> | undefined,
  guestName: string | null,
  guests: Array<{ name: string; rsvpStatus: string | null }>,
  showGuestNames: boolean
): React.ReactNode {
  const c = sec.content as Record<string, unknown>;

  // Image-based section: the uploaded image IS the content (any section type).
  if (c.mode === "image" && c.imageUrl && components.image) {
    const C = components.image;
    return <C content={c as never} theme={tokens} />;
  }

  switch (sec.type) {
    case "cover": {
      const C = components.cover;
      return C ? (
        <C
          content={c as { heading?: string; subheading?: string; guestLabel?: string }}
          eventTitle={data.event.title}
          eventDate={data.event.eventDate}
          venueName={data.event.venueName}
          guestName={guestName}
          theme={tokens}
          assets={assets}
        />
      ) : null;
    }
    case "countdown": {
      const C = components.countdown;
      return C ? (
        <C
          targetDate={(c.targetDate as string) ?? ""}
          label={c.label as string | undefined}
          eventDate={data.event.eventDate}
          theme={tokens}
        />
      ) : null;
    }
    case "agenda": {
      const C = components.agenda;
      return C ? <C content={c as never} theme={tokens} /> : null;
    }
    case "details": {
      const C = components.details;
      return C ? (
        <C content={c as never} venueName={data.event.venueName} venueMapUrl={data.event.venueMapUrl} theme={tokens} />
      ) : null;
    }
    case "gallery": {
      const C = components.gallery;
      return C ? <C content={c as never} photos={data.photos} theme={tokens} /> : null;
    }
    case "video": {
      const C = components.video;
      return C ? <C content={c as never} theme={tokens} /> : null;
    }
    case "khqr": {
      const C = components.khqr;
      return C ? <C content={c as never} theme={tokens} /> : null;
    }
    case "wishing": {
      const C = components.wishing;
      return data.pkg?.hasWishing && C ? (
        <C invitationId={data.invitation.id} initialWishes={data.wishes} content={c as never} theme={tokens} />
      ) : null;
    }
    case "image": {
      const C = components.image;
      return C ? <C content={c as never} theme={tokens} /> : null;
    }
    case "guestlist": {
      const C = components.guestlist;
      return C ? <C content={c as never} guests={guests} showNames={showGuestNames} theme={tokens} /> : null;
    }
    default:
      return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadInviteData(slug);
  if (!data) return { title: "Invitation" };

  const description = `You're invited to ${data.event.title}`;
  // Per-event social preview image. Each invitation can carry its own thumbnail
  // (set by admin / on packages that allow custom thumbnails); fall back to none.
  const images = data.invitation.thumbnailUrl ? [{ url: data.invitation.thumbnailUrl }] : undefined;

  return {
    title: data.event.title,
    description,
    openGraph: {
      title: data.event.title,
      description,
      type: "website",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: data.event.title,
      description,
      images,
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
  const tokens = theme.tokens;
  const components: SectionComponents = { ...STANDARD_SECTIONS, ...theme.sections };
  const layout = theme.layout ?? standardLayout;

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

  // Guestlist widget data — loaded fresh (outside the cache) so counts are live.
  // Full names are only revealed on a personal (?g=) link; otherwise counts only.
  const hasGuestlist = data.sections.some((s) => s.type === "guestlist");
  const guests = hasGuestlist
    ? await prisma.guest.findMany({
        where: { eventId: data.event.id },
        select: { name: true, rsvpStatus: true },
        orderBy: { name: "asc" },
      })
    : [];
  const showGuestNames = !!guestName;

  // Single fixed background (Spotlight-style themes): admin-set invitation
  // background, falling back to the cover section's uploaded background.
  const coverBg = data.sections.find((s) => s.type === "cover")?.content as
    | { bgUrl?: string; bgVideo?: string }
    | undefined;
  const bgUrl = theme.singleBackground
    ? data.invitation.backgroundUrl || coverBg?.bgVideo || coverBg?.bgUrl || null
    : null;
  const bgIsVideo = !!bgUrl && /\.(mp4|webm|mov)$/i.test(bgUrl);

  // Running index of rendered non-cover sections, for background alternation.
  let altIndex = 0;

  // Greeting fallback for the opening gate (when there's no personalized guest).
  const coverContent = data.sections.find((s) => s.type === "cover")?.content as
    | { guestLabel?: string }
    | undefined;

  // ── Package-driven feature gating ──
  const pkg = data.pkg;
  const showOpeningCover = pkg?.hasOpeningCover ?? false;
  const showWatermark = (pkg?.hasWatermark ?? true) && data.invitation.showWatermark;
  // ABA/KHQR floating action: package includes KHQR AND a QR section exists.
  const hasKhqr =
    (pkg?.hasKhqr ?? false) &&
    data.sections.some(
      (sec) => sec.type === "khqr" && !!(sec.content as { qrImageUrl?: string })?.qrImageUrl
    );

  const shell = (
    <div
      className={`invite-shell${layout.shellClass ? " " + layout.shellClass : ""}`}
      style={{ background: bgUrl ? "transparent" : tokens.bg }}
    >
      {data.sections.map((sec) => {
        const node = renderSection(sec, data, tokens, components, theme.assets, guestName, guests, showGuestNames);
        if (!node) return null;

        if (sec.type === "cover") {
          const cover = layout.wrapCover ? layout.wrapCover(node, tokens) : node;
          return <Fragment key={sec.id}>{cover}</Fragment>;
        }

        const wrapped = layout.wrapSection
          ? layout.wrapSection(node, { type: sec.type as SectionType, index: altIndex, tokens })
          : node;
        altIndex++;
        // The KHQR section gets a scroll anchor so the floating ABA button can
        // jump to it (theme-agnostic — sits outside the theme's own chrome).
        if (sec.type === "khqr") {
          return <div key={sec.id} id="inv-khqr">{wrapped}</div>;
        }
        return <Fragment key={sec.id}>{wrapped}</Fragment>;
      })}

      {layout.footer?.({ tokens, eventTitle: data.event.title })}

      {/* RSVP button + modal */}
      <RsvpModal
        eventId={data.event.id}
        hasGuestControl={pkg?.hasGuestControl ?? false}
        theme={tokens}
      />

      {/* Floating action stack — each button gated by the client's package */}
      <InviteActions
        venueMapUrl={pkg?.hasLocation ? data.event.venueMapUrl : null}
        musicUrl={pkg?.hasMusic ? data.invitation.musicUrl : null}
        hasKhqr={hasKhqr}
        theme={{ btnBg: tokens.musicBg, btnText: tokens.musicColor }}
      />

      {/* Powered-by watermark (Saving / Standard tiers) */}
      {showWatermark && <Watermark />}
    </div>
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={buildFontsHref(theme.fonts)} />
      <style dangerouslySetInnerHTML={{ __html: buildInviteCss(theme) }} />

      {/* Single fixed background behind the whole invite (admin-controlled). */}
      {bgUrl && (
        <div className="inv-fixed-bg">
          {bgIsVideo ? (
            <video className="inv-fixed-bg-media" src={bgUrl} autoPlay muted loop playsInline />
          ) : (
            <div className="inv-fixed-bg-media" style={{ backgroundImage: `url(${bgUrl})` }} />
          )}
          <div className="inv-fixed-bg-scrim" />
        </div>
      )}

      {/* Opening cover (Royalty's motion opening screen) — only when the package
          includes it; otherwise the letter shows immediately. */}
      {showOpeningCover ? (
        <InviteGate
          eventTitle={data.event.title}
          guestName={guestName}
          guestLabel={coverContent?.guestLabel}
          theme={tokens}
        >
          {shell}
        </InviteGate>
      ) : (
        shell
      )}
    </>
  );
}
