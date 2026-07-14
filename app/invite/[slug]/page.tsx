import { Fragment } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { getCachedInvite, setCachedInvite, type InviteData } from "@/lib/utils/invite-cache";
import { STANDARD_CSS, buildFontsHref, DEFAULT_FONTS } from "@/lib/themes/shared/standard-css";
import { getTheme } from "@/lib/themes/registry";
import { resolveDesign, FREEFORM_THEME_ID, STANDARD_THEME_ID, type DesignPalette } from "@/lib/themes/design";
import { STANDARD_TOKENS } from "@/lib/themes/themes/standard";
import { khqrItems } from "./_components/khqr-utils";
import type { SectionComponents, SectionType, ThemeTokens, ThemeLayout } from "@/lib/themes/types";
import { DB_SECTIONS } from "./_components/db-section-map";
import { STANDARD_SECTIONS, renderSection, makeAnchorId } from "./_components/render-section";
import { InviteLiveSections } from "./_components/InviteLiveSections";
import { RevealOnScroll, type SectionEffect } from "./_components/RevealOnScroll";
import { RsvpModal } from "./_components/RsvpModal";
import { InviteActions } from "./_components/InviteActions";
import { Watermark } from "./_components/Watermark";
import { InviteGate, type ElementPositions } from "./_components/InviteGate";
import { InviteLangProvider } from "./_components/InviteLang";
import { PreviewFocus } from "./_components/PreviewFocus";
import { BuilderInvite } from "./_components/BuilderInvite";
import type { BuilderState } from "@/lib/builder/canvas";
import dynamic from "next/dynamic";

// ssr: false — avoids PathnameContext not being ready during SSR of the invite page
const ThemePoller = dynamic(
  () => import("./_components/ThemePoller").then((m) => ({ default: m.ThemePoller })),
  { ssr: false }
);

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
  searchParams: Promise<{ g?: string; preview?: string; focus?: string }>;
}) {
  const { slug } = await params;
  const data = await loadInviteData(slug);
  const loadedAt = Date.now();

  // Admin preview — bypass isPublished gate so admin can preview before publish
  const { g, preview, focus } = await searchParams;
  let viewerIsAdmin = false;
  if (preview === "1") {
    const session = await getSession();
    viewerIsAdmin = session?.role === "admin";
  }

  if (!data || (!data.invitation.isPublished && !viewerIsAdmin)) notFound();

  const inv = data.invitation;

  // ONE design document drives rendering (lib/themes/design.ts). The adapter
  // reads the legacy columns; design.themeId is the only renderer key.
  const design = resolveDesign({
    overlayConfig: inv.overlayConfig,
    defaultSections: inv.defaultSections,
    sectionRows: data.sections,
  });
  const { gate, page } = design;

  // Personalized guest name
  let guestName: string | null = null;
  if (g) {
    const guest = await prisma.guest.findFirst({
      where: { token: g, eventId: data.event.id },
      select: { name: true },
    });
    guestName = guest?.name ?? null;
  }

  // Freeform theme — the builder canvas ships its own full-page renderer.
  // Still needs the shared Google Fonts stylesheet: the builder's font picker
  // (FONT_OPTIONS in EventBuilder.tsx) offers every family in BASE_FONT_FAMILIES,
  // and without this link they silently fall back to system fonts on the live page.
  if (design.themeId === FREEFORM_THEME_ID) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={buildFontsHref()} />
        <BuilderInvite state={design.builderDraft as BuilderState} guestName={guestName ?? undefined} />
      </>
    );
  }

  const themeMod = getTheme(design.themeId);
  const isStandard = themeMod.id === STANDARD_THEME_ID;
  const baseTokens: ThemeTokens = { ...STANDARD_TOKENS, ...themeMod.tokens };
  const isPhotoMode = inv.contentType === "photo";

  const headingFont  = design.fonts.heading || baseTokens.headingFont || (isStandard ? DEFAULT_FONTS.heading : baseTokens.font);
  const headerFont   = design.fonts.header  || baseTokens.headerFont || headingFont;
  const bodyFont     = design.fonts.body    || baseTokens.font;
  const { headingScale, bodyScale } = design.fonts;
  // Action-button colors follow the active theme unless the design overrides them.
  const actionButton = page.actionButton ?? { bg: baseTokens.musicBg, color: baseTokens.musicColor };

  // Two palettes: `design.palette` drives the content sections,
  // `design.gatePalette` drives the landing page (gate).
  const buildTokens = (c: DesignPalette): ThemeTokens => ({
    ...baseTokens,
    font:        bodyFont,
    headingFont,
    headerFont,
    headingScale,
    bodyScale,
    text:     c.text     ?? baseTokens.text,
    primary:  c.text     ?? baseTokens.primary,
    accent:   c.accent   ?? baseTokens.accent,
    border:   c.accent   ? c.accent + "44" : baseTokens.border,
    btnBg:    c.accent   ?? baseTokens.btnBg,
    musicColor: c.accent ?? baseTokens.musicColor,
    muted:    c.muted    ?? baseTokens.muted,
    title:    c.title    ?? c.text    ?? baseTokens.title,
    subtitle: c.subtitle ?? c.text    ?? baseTokens.subtitle,
    header:   c.header   ?? c.accent  ?? baseTokens.header,
    body:     c.body     ?? c.text    ?? baseTokens.body,
    coverGradient: !isStandard ? baseTokens.coverGradient
      : isPhotoMode ? "transparent"
      : "linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0.08))",
  });

  const tokens     = { ...buildTokens(design.palette), showMonogramInSections: gate.monogram.sections };
  const gateBase   = buildTokens(design.gatePalette);
  // The gate is the cover PAGE and must be opaque so the sections wallpaper
  // (backgroundUrl) never bleeds through it — the gate shows only its own cover
  // image or, without one, an opaque backdrop. Admin's plain gate color wins.
  const gateBackdrop =
    gate.bgColor ||
    (gateBase.coverGradient && gateBase.coverGradient !== "transparent"
      ? gateBase.coverGradient
      : (gateBase.bg && gateBase.bg !== "transparent" ? gateBase.bg : "#0c0c14"));
  const gateTokens = { ...gateBase, coverGradient: gateBackdrop };

  const components: SectionComponents = { ...STANDARD_SECTIONS, ...DB_SECTIONS, ...(themeMod.sections ?? {}) };
  const layout: ThemeLayout = themeMod.layout ?? {};

  const activeSections: InviteData["sections"] = design.sections
    .filter((s) => s.included)
    .map((s) => ({ id: s.id, type: s.type, sortOrder: s.sortOrder, content: s.content }));

  const activeMusicUrl = inv.musicUrl ?? null;

  // Background asset
  const bgUrl = inv.backgroundVideoUrl || inv.backgroundUrl || null;
  const bgIsVideo = !!bgUrl && /\.(mp4|webm|mov)$/i.test(bgUrl);
  const showBgScrim = !!bgUrl;

  // Cover asset passed to cover section renderer
  const themeAssets = inv.coverUrl ? { cover: inv.coverUrl } : undefined;

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

  const coverContent = activeSections.find((s) => s.type === "cover")?.content as { guestLabel?: string; logoUrl?: string; subheading?: string; greeting?: string; heading?: string } | undefined;
  // Gate monogram = the uploaded logo only. Removing the logo removes the
  // monogram (no silent fallback to the cover image).
  const gateMonogramUrl = coverContent?.logoUrl || null;
  // The event's `title` field is an internal admin label (used to identify the
  // event in lists/filenames) — the cover section's `heading` is the actual
  // guest-facing wording, editable separately. Fall back to the title when unset.
  const displayTitle = coverContent?.heading || data.event.title;

  // When "show cover after opening" is off, the cover lives only on the gate —
  // drop it from the scrolling sections so guests land straight on the content.
  const renderedSections = gate.keepCoverAfterOpen
    ? activeSections
    : activeSections.filter((s) => s.type !== "cover");

  const anchorId = makeAnchorId();
  const effectFor = (sec: InviteData["sections"][number]): SectionEffect =>
    (sec.content as { _effect?: { entrance?: SectionEffect } } | null)?._effect?.entrance ?? page.sectionEffect;

  const shell = (
    <div
      className={`invite-shell${layout.shellClass ? ` ${layout.shellClass}` : ""}`}
      // Themes with a shell class paint their own background via CSS; otherwise
      // the shell stays transparent over the fixed page background.
      style={layout.shellClass ? undefined : { background: "transparent" }}
    >
      {/* Editor live preview: content edits arrive via postMessage and render
          instantly, unsaved, without reloading the iframe (see InviteLiveSections). */}
      {preview === "1" ? (
        <InviteLiveSections
          initialSections={activeSections}
          keepCoverAfterOpen={gate.keepCoverAfterOpen}
          data={data}
          tokens={tokens}
          themeId={design.themeId}
          themeAssets={themeAssets}
          guestName={guestName}
          guests={guests}
          showGuestNames={showGuestNames}
          sectionEffect={page.sectionEffect}
        />
      ) : (
        (() => {
          let altIndex = 0;
          return renderedSections.map((sec) => {
            const node = renderSection(sec, data, tokens, components, themeAssets, guestName, guests, showGuestNames);
            if (!node) return null;

            if (sec.type === "cover") {
              return (
                <div key={sec.id} id={anchorId("cover")}>
                  <RevealOnScroll effect={effectFor(sec)}>
                    {layout.wrapCover ? layout.wrapCover(node, tokens) : node}
                  </RevealOnScroll>
                </div>
              );
            }

            const wrapped = layout.wrapSection
              ? layout.wrapSection(node, { type: sec.type as SectionType, index: altIndex, tokens })
              : node;
            altIndex++;

            // Anchor per section — used by the editor's live preview (focus) and
            // the floating gift button (khqr).
            return (
              <div key={sec.id} id={anchorId(sec.type)}>
                <RevealOnScroll effect={effectFor(sec)}>{wrapped}</RevealOnScroll>
              </div>
            );
          });
        })()
      )}

      {layout.footer?.({ tokens, eventTitle: displayTitle })}

      {page.showRsvp && (
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
        showRsvp={page.showRsvp}
        theme={{ btnBg: actionButton.bg, btnText: actionButton.color }}
        config={page.floatButtons}
      />

      {showWatermark && <Watermark />}
    </div>
  );

  // Bilingual toggle — wraps the shell so every DB section can read the active
  // language from context; the floating toggle switches the whole content.
  const langShell = (
    <InviteLangProvider
      enabled={page.languages.enabled}
      primaryLabel={page.languages.primaryLabel}
      secondaryLabel={page.languages.secondaryLabel}
    >
      {shell}
    </InviteLangProvider>
  );

  return (
    <>
      <ThemePoller slug={slug} loadedAt={loadedAt} />
      {/* Editor live preview: skip the gate + scroll to the section being edited */}
      {preview === "1" && <PreviewFocus initial={typeof focus === "string" ? focus : undefined} />}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={buildFontsHref(themeMod.fonts)} />
      <style dangerouslySetInnerHTML={{ __html: STANDARD_CSS + (themeMod.css ?? "") }} />

      {/* Desktop-only backdrop around the portrait invite — a distinct image/color
          from the Sections background below, which is scoped to the portrait column. */}
      {(page.outerBg.url || page.outerBg.color) && (
        <div className="inv-outer-bg">
          {page.outerBg.url ? (
            <div className="inv-outer-bg-media" style={{ backgroundImage: `url(${page.outerBg.url})` }} />
          ) : (
            <div className="inv-outer-bg-media" style={{ background: page.outerBg.color! }} />
          )}
        </div>
      )}

      {/* Sections background — media (image / GIF / motion video) or a plain
          admin-picked color; the gate renders its own bg on top */}
      {(bgUrl || page.bgColor) && (
        <div className="inv-fixed-bg">
          {bgUrl ? (
            bgIsVideo ? (
              <video
                className="inv-fixed-bg-media"
                src={bgUrl}
                autoPlay
                muted
                loop
                playsInline
                style={page.sectionBlur > 0 ? { filter: `blur(${page.sectionBlur}px)`, transform: "scale(1.06)" } : undefined}
              />
            ) : (
              <div
                className="inv-fixed-bg-media"
                style={{
                  backgroundImage: `url(${bgUrl})`,
                  ...(page.sectionBlur > 0 ? { filter: `blur(${page.sectionBlur}px)`, transform: "scale(1.06)" } : {}),
                }}
              />
            )
          ) : (
            <div className="inv-fixed-bg-media" style={{ background: page.bgColor! }} />
          )}
          {showBgScrim && page.sectionOverlay.enabled && (
            <div
              className="inv-fixed-bg-scrim"
              style={{ background: page.sectionOverlay.color, opacity: page.sectionOverlay.opacity }}
            />
          )}
        </div>
      )}

      {showOpeningCover ? (
        <InviteGate
          eventTitle={displayTitle}
          pretitle={coverContent?.greeting}
          pretitleFit={gate.pretitleFit}
          subheading={coverContent?.subheading}
          subheadingFit={gate.subheadingFit}
          guestName={guestName}
          guestLabel={coverContent?.guestLabel}
          guestPrefix={gate.guestPrefix}
          guestPrefixColor={gate.guestPrefixColor}
          guestPrefixFont={gate.guestPrefixFont}
          guestPrefixSize={gate.guestPrefixSize}
          guestPrefixWeight={gate.guestPrefixWeight}
          guestPrefixFit={gate.guestPrefixFit}
          guestNameFit={gate.guestNameFit}
          titleFit={gate.titleFit}
          theme={gateTokens}
          bgUrl={inv.coverUrl}
          coverUrl={gateMonogramUrl}
          gateOverlay={gate.overlay}
          revealStyle={gate.revealStyle}
          animateOpen={gate.animateOpen}
          openButtonColor={gate.openButtonColor}
          openButtonStroke={gate.openButtonStroke}
          openButtonFill={gate.openButtonFill}
          openButtonText={gate.openButtonText}
          openButtonFont={gate.openButtonFont}
          openButtonSize={gate.openButtonSize}
          openButtonWeight={gate.openButtonWeight}
          openButtonStrokeEnabled={gate.openButtonStrokeEnabled}
          openButtonFillEnabled={gate.openButtonFillEnabled}
          openButtonFit={gate.openButtonFit}
          scrollGuide={gate.scrollGuide}
          guideText={gate.guideText}
          hand={gate.hand}
          scrollToContent={gate.keepCoverAfterOpen}
          position={gate.position}
          blur={gate.backgroundBlur}
          showGuestName={gate.showGuestName}
          guestFrameUrl={gate.guestFrameUrl}
          showMonogram={gate.monogram.gate}
          elementPositions={gate.elementPositions as ElementPositions | undefined}
          gateDecoration={themeMod.gateDecoration}
        >
          {langShell}
        </InviteGate>
      ) : (
        langShell
      )}
    </>
  );
}
