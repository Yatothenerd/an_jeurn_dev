import { Fragment } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { getCachedInvite, setCachedInvite, type InviteData } from "@/lib/utils/invite-cache";
import { STANDARD_CSS, buildFontsHref, DEFAULT_FONTS } from "@/lib/themes/shared/standard-css";
import { khqrItems } from "./_components/khqr-utils";
import type { SectionComponents, SectionType, ThemeTokens, ThemeLayout } from "@/lib/themes/types";
import { DB_SECTIONS } from "./_components/db-section-map";
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
import { InviteGate, type ElementPositions } from "./_components/InviteGate";
import { BuilderInvite } from "./_components/BuilderInvite";
import type { BuilderState } from "@/lib/builder/canvas";
import dynamic from "next/dynamic";

// ssr: false — avoids PathnameContext not being ready during SSR of the invite page
const ThemePoller = dynamic(
  () => import("./_components/ThemePoller").then((m) => ({ default: m.ThemePoller })),
  { ssr: false }
);

const STANDARD_SECTIONS: SectionComponents = {
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
};

// ── Fallback token defaults ────────────────────────────────────────────────────

const DEFAULT_TOKENS: ThemeTokens = {
  font: "'Georgia','Times New Roman',serif",
  bg: "transparent",
  altBg: "rgba(0,0,0,0.10)",
  cardBg: "rgba(255,255,255,0.10)",
  coverGradient: "linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0.08))",
  text: "#ffffff",
  primary: "#ffffff",
  muted: "rgba(255,255,255,0.55)",
  accent: "#c9a96e",
  border: "rgba(201,169,110,0.44)",
  btnBg: "#c9a96e",
  btnText: "#fff",
  musicBg: "rgba(0,0,0,0.50)",
  musicColor: "#c9a96e",
  title:    "#ffffff",
  subtitle: "rgba(255,255,255,0.88)",
  header:   "#c9a96e",
  body:     "rgba(255,255,255,0.85)",
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadInviteData(slug: string): Promise<InviteData | null> {
  const cached = await getCachedInvite(slug);
  if (cached) return cached;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      invitation: {
        include: {
          sections: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } },
          photos:   { orderBy: { sortOrder: "asc" } },
          wishes:   { orderBy: { createdAt: "desc" }, take: 50 },
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
      id:          event.id,
      title:       event.title,
      eventType:   event.eventType,
      eventDate:   event.eventDate.toISOString(),
      venueName:   event.venueName,
      venueMapUrl: event.venueMapUrl,
      slug:        event.slug,
    },
    invitation: {
      id:                 inv.id,
      contentType:        inv.contentType,
      defaultSections:    inv.defaultSections,
      overlayConfig:      inv.overlayConfig as Record<string, unknown> | null,
      backgroundUrl:      inv.backgroundUrl,
      backgroundVideoUrl: inv.backgroundVideoUrl,
      coverUrl:           inv.coverUrl,
      musicUrl:           inv.musicUrl,
      thumbnailUrl:       inv.thumbnailUrl,
      shareLink:          inv.shareLink,
      showWatermark:      inv.showWatermark,
      isPublished:        inv.isPublished,
      isAnimated:         inv.isAnimated,
    },
    sections: inv.sections.map((s) => ({ id: s.id, type: s.type, sortOrder: s.sortOrder, content: s.content })),
    photos:   inv.photos.map((p) => ({ id: p.id, url: p.url, sortOrder: p.sortOrder })),
    pkg: pkg ? {
      hasWishing:      pkg.hasWishing,
      hasGuestControl: pkg.hasGuestControl,
      hasMusic:        pkg.hasMusic,
      hasKhqr:         pkg.hasKhqr,
      hasLocation:     pkg.hasLocation,
      hasOpeningCover: pkg.hasOpeningCover,
      hasWatermark:    pkg.hasWatermark,
      galleryType:     pkg.galleryType,
    } : null,
    wishes: inv.wishes.map((w) => ({ id: w.id, guestName: w.guestName, message: w.message, createdAt: w.createdAt.toISOString() })),
  };

  await setCachedInvite(slug, data);
  return data;
}

// ── Section rendering ─────────────────────────────────────────────────────────

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
    case "wording": {
      const C = components.wording;
      return C ? <C content={c as { text?: string; imageUrl?: string; title?: string; hideTitle?: boolean }} theme={tokens} /> : null;
    }
    case "countdown": {
      const C = components.countdown;
      return C ? (
        <C
          targetDate={(c.targetDate as string) ?? ""}
          label={c.label as string | undefined}
          eventDate={data.event.eventDate}
          theme={tokens}
          hideTitle={c.hideTitle as boolean | undefined}
        />
      ) : null;
    }
    case "agenda": {
      const C = components.agenda;
      return C ? (
        <C content={c as never} venueName={data.event.venueName} venueMapUrl={data.event.venueMapUrl} theme={tokens} />
      ) : null;
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
  const images = data.invitation.thumbnailUrl ? [{ url: data.invitation.thumbnailUrl }] : undefined;

  return {
    title: data.event.title,
    description,
    openGraph: { title: data.event.title, description, type: "website", images },
    twitter: { card: images ? "summary_large_image" : "summary", title: data.event.title, description, images },
  };
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string; preview?: string }>;
}) {
  const { slug } = await params;
  const data = await loadInviteData(slug);
  const loadedAt = Date.now();

  // Admin preview — bypass isPublished gate so admin can preview before publish
  const { g, preview } = await searchParams;
  let viewerIsAdmin = false;
  if (preview === "1") {
    const session = await getSession();
    viewerIsAdmin = session?.role === "admin";
  }

  if (!data || (!data.invitation.isPublished && !viewerIsAdmin)) notFound();

  const inv = data.invitation;

  // Builder-driven invite: if this event was authored in the new EventBuilder,
  // render it directly from the saved builder state so guests see exactly what
  // the editor preview shows. Legacy (theme-based) events fall through below.
  const builderDraft = (inv.overlayConfig as Record<string, unknown> | null)?.builderDraft as BuilderState | undefined;
  if (builderDraft && typeof builderDraft === "object" && Array.isArray(builderDraft.sections)) {
    let gName: string | null = null;
    if (g) {
      const guest = await prisma.guest.findFirst({ where: { token: g, eventId: data.event.id }, select: { name: true } });
      gName = guest?.name ?? null;
    }
    return <BuilderInvite state={builderDraft} guestName={gName ?? undefined} />;
  }

  const isPhotoMode = inv.contentType === "photo";

  // Build tokens from the invitation's overlayConfig (colors + fonts).
  // Two palettes: `colorScheme` drives the content sections, `gateColorScheme`
  // drives the landing page (gate); the latter falls back to the former.
  type CS = {
    text?: string; accent?: string;
    title?: string; subtitle?: string; header?: string; body?: string; muted?: string;
  };
  const oc = inv.overlayConfig as {
    colorScheme?: CS;
    gateColorScheme?: CS;
    fonts?: { heading?: string; body?: string; headingScale?: number; bodyScale?: number };
    backgroundBlur?: number;
    sectionBlur?: number;
    sectionOverlay?: { enabled: boolean; color: string; opacity: number };
    gateOverlay?: { enabled: boolean; color: string; opacity: number };
    actionButton?: { bg: string; color: string };
    revealStyle?: "fade" | "envelope" | "curtain" | "slideUp";
    keepCoverAfterOpen?: boolean;
    scrollGuide?: boolean;
    gatePosition?: "top" | "center" | "bottom";
    showGuestName?: boolean;
    guestFrameUrl?: string | null;
    monogram?: { gate: boolean; sections: boolean };
    elementPositions?: ElementPositions;
    showRsvp?: boolean;
  } | null;

  const headingFont  = oc?.fonts?.heading || DEFAULT_FONTS.heading;
  const bodyFont      = oc?.fonts?.body    || DEFAULT_FONTS.body;
  const headingScale = oc?.fonts?.headingScale ?? 1;
  const bodyScale    = oc?.fonts?.bodyScale ?? 1;
  const backgroundBlur    = oc?.backgroundBlur ?? 0;
  const sectionBlur       = oc?.sectionBlur ?? 0;
  const sectionOverlay    = oc?.sectionOverlay ?? { enabled: false, color: "#000000", opacity: 0.25 };
  const gateOverlay       = oc?.gateOverlay ?? { enabled: false, color: "#000000", opacity: 0.45 };
  const actionButton      = oc?.actionButton ?? { bg: "rgba(0,0,0,0.5)", color: "#c9a96e" };
  const revealStyle       = oc?.revealStyle ?? "fade";
  const keepCoverAfterOpen = oc?.keepCoverAfterOpen ?? true;
  const scrollGuide       = oc?.scrollGuide ?? true;
  const gatePosition      = oc?.gatePosition ?? "center";
  const showGuestName     = oc?.showGuestName ?? true;
  const guestFrameUrl     = oc?.guestFrameUrl ?? null;
  const monogram          = oc?.monogram ?? { gate: true, sections: false };
  const elementPositions  = oc?.elementPositions ?? undefined;
  const showRsvp          = oc?.showRsvp ?? true;

  const buildTokens = (c: CS): ThemeTokens => ({
    ...DEFAULT_TOKENS,
    font:        bodyFont,
    headingFont,
    headingScale,
    bodyScale,
    text:     c.text     ?? DEFAULT_TOKENS.text,
    primary:  c.text     ?? DEFAULT_TOKENS.primary,
    accent:   c.accent   ?? DEFAULT_TOKENS.accent,
    border:   c.accent   ? c.accent + "44" : DEFAULT_TOKENS.border,
    btnBg:    c.accent   ?? DEFAULT_TOKENS.btnBg,
    musicColor: c.accent ?? DEFAULT_TOKENS.musicColor,
    muted:    c.muted    ?? DEFAULT_TOKENS.muted,
    title:    c.title    ?? c.text    ?? DEFAULT_TOKENS.title,
    subtitle: c.subtitle ?? c.text    ?? DEFAULT_TOKENS.subtitle,
    header:   c.header   ?? c.accent  ?? DEFAULT_TOKENS.header,
    body:     c.body     ?? c.text    ?? DEFAULT_TOKENS.body,
    coverGradient: isPhotoMode ? "transparent"
      : "linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0.08))",
  });

  const cs = oc?.colorScheme ?? {};
  const tokens     = { ...buildTokens(cs), showMonogramInSections: monogram.sections };
  const gateTokens = buildTokens(oc?.gateColorScheme ?? cs);

  const components: SectionComponents = { ...STANDARD_SECTIONS, ...DB_SECTIONS };
  const layout: ThemeLayout = {};

  // Active sections come from invitation.defaultSections (admin-configured via EventWizard)
  const rawDs = inv.defaultSections as Array<{ type: string; included: boolean; content: unknown }> | null;
  const activeSections: InviteData["sections"] = rawDs
    ? rawDs.filter((s) => s.included).map((s, i) => ({ id: `ds-${i}`, type: s.type, sortOrder: i, content: s.content }))
    : data.sections;

  const activeMusicUrl = inv.musicUrl ?? null;

  // Background asset
  const bgUrl = inv.backgroundVideoUrl || inv.backgroundUrl || null;
  const bgIsVideo = !!bgUrl && /\.(mp4|webm|mov)$/i.test(bgUrl);
  const showBgScrim = !!bgUrl;

  // Cover asset passed to cover section renderer
  const themeAssets = inv.coverUrl ? { cover: inv.coverUrl } : undefined;

  // Personalized guest name (g is already destructured above)
  let guestName: string | null = null;
  if (g) {
    const guest = await prisma.guest.findFirst({
      where: { token: g, eventId: data.event.id },
      select: { name: true },
    });
    guestName = guest?.name ?? null;
  }

  // Guestlist widget — loaded fresh so counts are live
  const hasGuestlist = activeSections.some((s) => s.type === "guestlist");
  const guests = hasGuestlist
    ? await prisma.guest.findMany({
        where: { eventId: data.event.id },
        select: { name: true, rsvpStatus: true },
        orderBy: { name: "asc" },
      })
    : [];
  const showGuestNames = !!guestName;

  const pkg = data.pkg;
  // Gate always shows — if a cover/bg image is uploaded it appears as backdrop;
  // without an image the theme gradient is used instead.
  const showOpeningCover = true;
  const showWatermark = (pkg?.hasWatermark ?? true) && inv.showWatermark;
  const hasKhqr =
    (pkg?.hasKhqr ?? false) &&
    activeSections.some((sec) => sec.type === "khqr" && khqrItems(sec.content as Parameters<typeof khqrItems>[0]).length > 0);

  const coverContent = activeSections.find((s) => s.type === "cover")?.content as { guestLabel?: string; logoUrl?: string } | undefined;
  // Gate monogram = the uploaded logo if present, otherwise fall back to the cover image.
  const gateMonogramUrl = coverContent?.logoUrl ?? inv.coverUrl;

  // When "show cover after opening" is off, the cover lives only on the gate —
  // drop it from the scrolling sections so guests land straight on the content.
  const renderedSections = keepCoverAfterOpen
    ? activeSections
    : activeSections.filter((s) => s.type !== "cover");

  let altIndex = 0;

  const shell = (
    <div
      className="invite-shell"
      style={{ background: "transparent" }}
    >
      {renderedSections.map((sec) => {
        const node = renderSection(sec, data, tokens, components, themeAssets, guestName, guests, showGuestNames);
        if (!node) return null;

        if (sec.type === "cover") {
          return <Fragment key={sec.id}>{node}</Fragment>;
        }

        const wrapped = layout.wrapSection
          ? layout.wrapSection(node, { type: sec.type as SectionType, index: altIndex, tokens })
          : node;
        altIndex++;

        if (sec.type === "khqr") {
          return <div key={sec.id} id="inv-khqr">{wrapped}</div>;
        }
        return <Fragment key={sec.id}>{wrapped}</Fragment>;
      })}

      {layout.footer?.({ tokens, eventTitle: data.event.title })}

      {showRsvp && (
        <RsvpModal
          eventId={data.event.id}
          hasGuestControl={pkg?.hasGuestControl ?? false}
          theme={tokens}
        />
      )}

      <InviteActions
        venueMapUrl={pkg?.hasLocation ? data.event.venueMapUrl : null}
        musicUrl={pkg?.hasMusic ? activeMusicUrl : null}
        hasKhqr={hasKhqr}
        showRsvp={showRsvp}
        theme={{ btnBg: actionButton.bg, btnText: actionButton.color }}
      />

      {showWatermark && <Watermark />}
    </div>
  );

  return (
    <>
      <ThemePoller slug={slug} loadedAt={loadedAt} />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={buildFontsHref()} />
      <style dangerouslySetInnerHTML={{ __html: STANDARD_CSS }} />

      {/* Sections background — always rendered; gate renders its own bg on top */}
      {bgUrl && (
        <div className="inv-fixed-bg">
          {bgIsVideo ? (
            <video className="inv-fixed-bg-media" src={bgUrl} autoPlay muted loop playsInline />
          ) : (
            <div
              className="inv-fixed-bg-media"
              style={{
                backgroundImage: `url(${bgUrl})`,
                ...(sectionBlur > 0 ? { filter: `blur(${sectionBlur}px)`, transform: "scale(1.06)" } : {}),
              }}
            />
          )}
          {showBgScrim && <div className="inv-fixed-bg-scrim" />}
          {sectionOverlay.enabled && (
            <div style={{ position: "absolute", inset: 0, background: sectionOverlay.color, opacity: sectionOverlay.opacity }} />
          )}
        </div>
      )}

      {showOpeningCover ? (
        <InviteGate
          eventTitle={data.event.title}
          guestName={guestName}
          guestLabel={coverContent?.guestLabel}
          theme={gateTokens}
          bgUrl={inv.coverUrl || inv.backgroundUrl}
          coverUrl={gateMonogramUrl}
          gateOverlay={gateOverlay}
          revealStyle={revealStyle}
          scrollGuide={scrollGuide}
          scrollToContent={keepCoverAfterOpen}
          position={gatePosition}
          blur={backgroundBlur}
          showGuestName={showGuestName}
          guestFrameUrl={guestFrameUrl}
          showMonogram={monogram.gate}
          elementPositions={elementPositions}
        >
          {shell}
        </InviteGate>
      ) : (
        shell
      )}
    </>
  );
}
