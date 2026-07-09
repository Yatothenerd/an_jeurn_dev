"use client";

import { useCountdown } from "@/lib/themes/shared/use-countdown";
import { useWishForm } from "@/lib/themes/shared/use-wish-form";
import { useLangContent } from "./InviteLang";
import type { ThemeTokens } from "@/lib/themes/types";
import type { InviteWish } from "@/lib/utils/invite-cache";
import { khqrItems, type KhqrContent } from "./khqr-utils";

// Semantic color helpers — read optional DB-theme tokens with fallback to legacy values.
// Keeping these inline so every section stays self-contained.
const tok = {
  title:    (t: ThemeTokens) => t.title    ?? t.text,
  subtitle: (t: ThemeTokens) => t.subtitle ?? t.text,
  header:   (t: ThemeTokens) => t.header   ?? t.accent,
  body:     (t: ThemeTokens) => t.body     ?? t.text,
  muted:    (t: ThemeTokens) => t.muted,
  heading:  (t: ThemeTokens) => t.headingFont ?? t.font,
  headerFont: (t: ThemeTokens) => t.headerFont ?? t.headingFont ?? t.font,
  hs:       (t: ThemeTokens) => t.headingScale ?? 1,
  bs:       (t: ThemeTokens) => t.bodyScale ?? 1,
};

// ── Per-section fine-tuning ───────────────────────────────────────────────────
// Editors may attach `content._style` to any text section for per-textbox
// overrides (font / color / size) on top of the theme's font scheme.
export interface SectionTextStyle {
  titleFont?: string;
  titleColor?: string;
  /** Multiplier on the theme heading scale (0.6–1.6). */
  titleScale?: number;
  /** Font weight (400–800). Falls back to the section title's default (600). */
  titleWeight?: number;
  /** Text alignment. Falls back to center. */
  titleAlign?: "left" | "center" | "right";
  bodyFont?: string;
  bodyColor?: string;
  /** Multiplier on the theme body scale (0.6–1.6). */
  bodyScale?: number;
  /** Font weight (400–800). Falls back to the browser default (400). */
  bodyWeight?: number;
  /** Text alignment. Falls back to each element's own default. */
  bodyAlign?: "left" | "center" | "right";
  headerColor?: string;
}

/** Merge a section's `_style` overrides into the theme tokens for that section.
 *  The visible section title is rendered by SecHead from the `header`/`headerFont`
 *  tokens, so the "Title" overrides must flow to those too (not only the
 *  `title`/`headingFont` tokens used by the cover) — otherwise changing a
 *  section's title font/color would have no visible effect. */
function styled(theme: ThemeTokens, content: unknown): ThemeTokens {
  const st = (content as { _style?: SectionTextStyle } | null)?._style;
  if (!st || typeof st !== "object") return theme;
  return {
    ...theme,
    headingFont:  st.titleFont  || theme.headingFont,
    headerFont:   st.titleFont  || theme.headerFont,
    title:        st.titleColor || theme.title,
    header:       st.titleColor || st.headerColor || theme.header,
    headingScale: (theme.headingScale ?? 1) * (st.titleScale || 1),
    titleWeight:  st.titleWeight || theme.titleWeight,
    titleAlign:   st.titleAlign  || theme.titleAlign,
    font:         st.bodyFont   || theme.font,
    body:         st.bodyColor  || theme.body,
    bodyScale:    (theme.bodyScale ?? 1) * (st.bodyScale || 1),
    bodyWeight:   st.bodyWeight || theme.bodyWeight,
    bodyAlign:    st.bodyAlign  || theme.bodyAlign,
  };
}

/** Scale a rem size by a multiplier, e.g. remScale(1.875, theme.headingScale). */
const remScale = (base: number, scale = 1) => `${+(base * scale).toFixed(4)}rem`;

// ── Shared primitives ─────────────────────────────────────────────────────────

function SecWrap({ children, theme }: { children: React.ReactNode; theme: ThemeTokens }) {
  return (
    // .inv-db-sec = full-screen fit (portrait-capped on desktop) + flex centering
    <section
      className="inv-db-sec"
      style={{
        padding: "3.25rem 1.75rem",
        borderTop: `1px solid ${theme.border}`,
        fontFamily: theme.font,
        fontSize: remScale(1, tok.bs(theme)),
        color: tok.body(theme),
        ...(theme.bodyWeight ? { fontWeight: theme.bodyWeight } : {}),
        ...(theme.bodyAlign ? { textAlign: theme.bodyAlign } : {}),
      }}
    >
      <div style={{ maxWidth: 400, margin: "0 auto", width: "100%" }}>{children}</div>
    </section>
  );
}

function SecHead({ label, theme }: { icon?: string; label: string; theme: ThemeTokens }) {
  return (
    <div style={{ textAlign: theme.titleAlign || "center", marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
        <div style={{ flex: 1, height: 1, background: tok.header(theme), opacity: 0.35 }} />
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: tok.header(theme) }} />
        <div style={{ flex: 1, height: 1, background: tok.header(theme), opacity: 0.35 }} />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: remScale(0.5625, tok.hs(theme)),
          fontWeight: theme.titleWeight || 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontFamily: tok.headerFont(theme),
          color: tok.header(theme),
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ── Cover ─────────────────────────────────────────────────────────────────────

interface CoverProps {
  content: { heading?: string; subheading?: string; guestLabel?: string; imageUrl?: string; logoUrl?: string };
  eventTitle: string;
  eventDate: string;
  venueName?: string | null;
  guestName?: string | null;
  theme: ThemeTokens;
  assets?: Record<string, string>;
}

export function DbCoverSection({ content: baseContent, eventTitle, eventDate, venueName, guestName, theme: baseTheme, assets }: CoverProps) {
  const content = useLangContent(baseContent);
  const theme = styled(baseTheme, content);
  const formatted = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // This section only renders when "Show cover after opening" is on, so it acts
  // as a mirror of the landing gate: the same cover image becomes the section's
  // full-bleed background (with a scrim for readability).
  const heroUrl = content.imageUrl ?? assets?.cover ?? null;
  // Monogram = the uploaded logo, shown only when section monograms are enabled.
  // No fallback to the cover image — removing the logo removes the monogram.
  const monogramUrl = theme.showMonogramInSections && content.logoUrl ? content.logoUrl : null;

  return (
    <section
      className="inv-db-sec"
      style={{
        alignItems: "center",
        textAlign: "center",
        padding: "5rem 1.75rem 4rem",
        fontFamily: theme.font,
        color: tok.body(theme),
        background: heroUrl
          ? `linear-gradient(to bottom, rgba(0,0,0,0.38), rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.45)), url(${heroUrl}) center / cover no-repeat`
          : theme.coverGradient,
      }}
    >
      {monogramUrl && (
        <img
          src={monogramUrl}
          alt="Monogram"
          style={{
            width: "clamp(96px, 30vw, 140px)",
            height: "clamp(96px, 30vw, 140px)",
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: "1.5rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* Main title */}
      <h1
        style={{
          fontSize: remScale(1.875, tok.hs(theme)),
          fontWeight: 300,
          letterSpacing: "0.08em",
          margin: "0 0 0.75rem",
          lineHeight: 1.2,
          fontStyle: "italic",
          fontFamily: tok.heading(theme),
          color: tok.title(theme),
        }}
      >
        {content.heading || eventTitle}
      </h1>

      {/* Subtitle / subheading */}
      <p style={{ fontSize: remScale(1, tok.bs(theme)), margin: "0 0 1.75rem", color: tok.subtitle(theme) }}>
        {content.subheading || "You are cordially invited"}
      </p>

      {/* Accent divider */}
      <div style={{ width: 40, height: 1, background: theme.accent, margin: "0 auto 1.5rem", opacity: 0.7 }} />

      {/* Date — grouped/muted text */}
      <p
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          margin: "0 0 0.5rem",
          color: tok.muted(theme),
        }}
      >
        {formatted}
      </p>

      {/* Venue — grouped/muted text */}
      {venueName && (
        <p style={{ fontSize: "0.9375rem", fontStyle: "italic", margin: "0.25rem 0 0", color: tok.muted(theme) }}>
          {venueName}
        </p>
      )}

      {/* Personalised guest pill */}
      {guestName && (
        <div
          style={{
            marginTop: "2.25rem",
            padding: "0.5rem 1.5rem",
            border: `1px solid ${theme.accent}`,
            borderRadius: 999,
            fontSize: "0.875rem",
            color: theme.accent,
            letterSpacing: "0.06em",
          }}
        >
          {content.guestLabel || "Dear"} {guestName}
        </div>
      )}

      {/* Scroll indicator */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "3rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.375rem",
          opacity: 0.3,
          color: tok.body(theme),
        }}
      >
        <div style={{ width: 1, height: 40, background: "currentColor" }} />
        <span style={{ fontSize: "0.5625rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>scroll</span>
      </div>
    </section>
  );
}

// ── Formal Wording ──────────────────────────────────────────────────────────────

interface WordingProps {
  content: { text?: string; imageUrl?: string; title?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}

export function DbWordingSection({ content: baseContent, theme: baseTheme }: WordingProps) {
  const content = useLangContent(baseContent);
  const theme = styled(baseTheme, content);
  const hasImage = !!content.imageUrl;
  const hasText = !!(content.text && content.text.trim());
  if (!hasImage && !hasText) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead label={content.title || "Invitation"} theme={theme} />}
      {hasImage ? (
        <img
          src={content.imageUrl}
          alt={content.title || "Invitation wording"}
          style={{ width: "100%", borderRadius: 12, display: "block", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
        />
      ) : (
        <div style={{ position: "relative", padding: "1.5rem 1.25rem" }}>
          {/* Opening quotation mark */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            fontSize: "4.5rem", lineHeight: 1, fontFamily: "Georgia, serif",
            color: tok.header(theme), opacity: 0.25, userSelect: "none",
          }}>&ldquo;</div>
          <p
            style={{
              textAlign: "center",
              whiteSpace: "pre-line",
              fontSize: remScale(1.0625, tok.bs(theme)),
              lineHeight: 2,
              fontStyle: "italic",
              color: tok.body(theme),
              margin: 0,
              position: "relative",
            }}
          >
            {content.text}
          </p>
          {/* Closing quotation mark */}
          <div style={{
            textAlign: "right",
            fontSize: "4.5rem", lineHeight: 1, fontFamily: "Georgia, serif",
            color: tok.header(theme), opacity: 0.25, userSelect: "none", marginTop: "-1rem",
          }}>&rdquo;</div>
          {/* Bottom ornament */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
            <div style={{ flex: 1, height: 1, background: tok.header(theme), opacity: 0.25 }} />
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: tok.header(theme), opacity: 0.5 }} />
            <div style={{ flex: 1, height: 1, background: tok.header(theme), opacity: 0.25 }} />
          </div>
        </div>
      )}
    </SecWrap>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────

interface CountdownProps {
  targetDate: string;
  label?: string;
  eventDate: string;
  theme: ThemeTokens;
  hideTitle?: boolean;
  /** Raw section content — carries `_style` overrides and per-unit colors. */
  content?: unknown;
}

/** Per-unit number color overrides, keyed by unit. Unset units fall back to
 *  the section's title color (itself overridable via the Text style panel). */
export interface CountdownUnitColors { days?: string; hours?: string; minutes?: string; seconds?: string }

export function DbCountdownSection({ targetDate, label, eventDate, theme: baseTheme, hideTitle, content }: CountdownProps) {
  const theme = styled(baseTheme, content);
  const unitColors = ((content as { countdownColors?: CountdownUnitColors } | undefined)?.countdownColors) ?? {};
  const time = useCountdown(targetDate, eventDate);

  return (
    <SecWrap theme={theme}>
      {!hideTitle && <SecHead label={label || "Countdown"} theme={theme} />}
      {time.expired ? (
        <p
          style={{
            textAlign: "center",
            fontSize: "1.25rem",
            fontWeight: 300,
            fontStyle: "italic",
            color: tok.body(theme),
          }}
        >
          The day has arrived!
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
          {[
            { v: time.days, l: "Days", key: "days" as const },
            { v: time.hours, l: "Hours", key: "hours" as const },
            { v: time.minutes, l: "Mins", key: "minutes" as const },
            { v: time.seconds, l: "Secs", key: "seconds" as const },
          ].map(({ v, l, key }) => (
            <div
              key={l}
              style={{
                textAlign: "center",
                background: theme.cardBg,
                borderRadius: 10,
                overflow: "hidden",
                border: `1px solid ${theme.border}`,
              }}
            >
              {/* Accent top bar */}
              <div style={{ height: 3, background: unitColors[key] || tok.header(theme), opacity: 0.7 }} />
              <div style={{ padding: "0.9rem 0.25rem 0.75rem" }}>
                <div
                  style={{
                    fontSize: remScale(2.125, tok.hs(theme)),
                    fontWeight: 300,
                    lineHeight: 1,
                    fontFamily: tok.heading(theme),
                    color: unitColors[key] || tok.title(theme),
                    letterSpacing: "-0.02em",
                  }}
                >
                  {String(v).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontSize: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    marginTop: "0.4rem",
                    color: tok.header(theme),
                  }}
                >
                  {l}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SecWrap>
  );
}

// ── Details ───────────────────────────────────────────────────────────────────

interface DetailItem {
  icon?: string;
  label: string;
  value: string;
}

interface PhotoDetailItem {
  imageUrl: string;
  caption: string;
}

interface DetailsProps {
  content: { title?: string; items?: DetailItem[]; photoItems?: PhotoDetailItem[]; hideTitle?: boolean };
  venueName: string | null;
  venueMapUrl: string | null;
  theme: ThemeTokens;
}

export function DbDetailsSection({ content: baseContent, venueName, venueMapUrl, theme: baseTheme }: DetailsProps) {
  const content = useLangContent(baseContent);
  const theme = styled(baseTheme, content);
  // Only show photo items that actually have an uploaded image (imageUrl non-empty)
  const photoItems = (content.photoItems ?? []).filter((it) => it.imageUrl);
  // Only show text items that have a non-empty value (ignore placeholder rows with value:"")
  const textItems: DetailItem[] = (content.items ?? []).filter((it) => it.value && it.value.trim() !== "");

  const hasVenueRow = textItems.some((it) => it.label.toLowerCase().includes("venue"));
  if (venueName && !hasVenueRow) textItems.push({ icon: "📍", label: "Venue", value: venueName });

  if (photoItems.length === 0 && textItems.length === 0 && !venueMapUrl) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead label={content.title || "Details"} theme={theme} />}

      {/* Photo-mode agenda items */}
      {photoItems.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            marginBottom: textItems.length > 0 ? "1rem" : 0,
          }}
        >
          {photoItems.map((item, i) => (
            <div
              key={i}
              style={{
                background: theme.cardBg,
                borderRadius:
                  i === 0 ? "10px 10px 0 0" : i === photoItems.length - 1 ? "0 0 10px 10px" : 0,
                overflow: "hidden",
              }}
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.caption} style={{ width: "100%", display: "block" }} />
              ) : (
                <div
                  style={{
                    width: "100%",
                    paddingTop: "56.25%",
                    background: "rgba(255,255,255,0.05)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.2,
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                </div>
              )}
              {item.caption && (
                <div
                  style={{
                    padding: "0.625rem 0.875rem",
                    fontSize: "0.9375rem",
                    color: tok.body(theme),
                  }}
                >
                  {item.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Text items */}
      {(textItems.length > 0 || venueMapUrl) && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {textItems.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                padding: "1rem 0",
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              {/* Accent left bar */}
              <div style={{ width: 3, alignSelf: "stretch", background: tok.header(theme), borderRadius: 2, opacity: 0.5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    marginBottom: "0.3rem",
                    color: tok.header(theme),
                  }}
                >
                  {row.label}
                </div>
                <div style={{ fontSize: remScale(0.9375, tok.bs(theme)), wordBreak: "break-word", color: tok.body(theme), lineHeight: 1.6 }}>
                  {row.value || "—"}
                </div>
              </div>
            </div>
          ))}
          {venueMapUrl && (
            <div style={{ paddingTop: "1.25rem" }}>
              <a
                href={venueMapUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  color: theme.accent,
                  textDecoration: "none",
                  fontSize: remScale(0.875, tok.bs(theme)),
                  letterSpacing: "0.06em",
                  borderBottom: `1px solid ${theme.accent}`,
                  paddingBottom: "1px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                </svg>
                View on Map
              </a>
            </div>
          )}
        </div>
      )}
    </SecWrap>
  );
}

// ── Agenda / Order of ceremony ─────────────────────────────────────────────────

interface AgendaItem {
  time?: string;
  title?: string;
  icon?: number | string;
  /** Per-row accent color (icon, time, divider bar). Falls back to the section's header color. */
  color?: string;
}

interface AgendaProps {
  content: { title?: string; items?: AgendaItem[]; hideTitle?: boolean };
  theme: ThemeTokens;
}

/** Timeline of time → moment rows. Distinct from Details (venue/address); this
 *  renders the event's schedule (`items: [{ time, title }]`). */
export function DbAgendaSection({ content: baseContent, theme: baseTheme }: AgendaProps) {
  const content = useLangContent(baseContent);
  const theme = styled(baseTheme, content);
  const items = (content.items ?? []).filter((it) => (it.time && it.time.trim()) || (it.title && it.title.trim()));
  if (items.length === 0) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead label={content.title || "Order of Ceremony"} theme={theme} />}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((row, i) => {
          const rowColor = row.color || tok.header(theme);
          return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.95rem 0",
              borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : "none",
            }}
          >
            <div
              style={{
                minWidth: 68,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                fontFamily: tok.headerFont(theme),
                fontSize: remScale(0.875, tok.bs(theme)),
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: rowColor,
              }}
            >
              {row.icon != null && row.icon !== "" && (
                <img src={`/themes/agenda/${row.icon}.png`} alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
              )}
              <span>{row.time || "—"}</span>
            </div>
            <div style={{ width: 3, alignSelf: "stretch", background: rowColor, borderRadius: 2, opacity: 0.5, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, fontSize: remScale(0.9375, tok.bs(theme)), color: tok.body(theme), lineHeight: 1.6, wordBreak: "break-word" }}>
              {row.title || ""}
            </div>
          </div>
          );
        })}
      </div>
    </SecWrap>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

interface GalleryProps {
  content: { layout?: string; title?: string; hideTitle?: boolean };
  photos: Array<{ id: string; url: string; sortOrder: number }>;
  theme: ThemeTokens;
}

export function DbGallerySection({ content: baseContent, photos, theme: baseTheme }: GalleryProps) {
  const content = useLangContent(baseContent);
  const theme = styled(baseTheme, content);
  if (photos.length === 0) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead label={content.title || "Gallery"} theme={theme} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {photos.map((p) => (
          <div
            key={p.id}
            style={{
              position: "relative",
              paddingTop: "100%",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(0,0,0,0.22)",
            }}
          >
            <img
              src={p.url}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        ))}
      </div>
    </SecWrap>
  );
}

// ── Video ─────────────────────────────────────────────────────────────────────

interface VideoProps {
  content: { url?: string; caption?: string; title?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}

export function DbVideoSection({ content: baseContent, theme: baseTheme }: VideoProps) {
  const content = useLangContent(baseContent);
  const theme = styled(baseTheme, content);
  const thumbnailUrl = (content as { thumbnailUrl?: string }).thumbnailUrl;
  if (!content.url && !thumbnailUrl) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead label={content.title || "Video"} theme={theme} />}
      {content.url ? (
        <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden" }}>
          <iframe
            src={content.url}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="event video"
          />
        </div>
      ) : (
        <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", position: "relative", boxShadow: "0 6px 28px rgba(0,0,0,0.3)" }}>
          <img
            src={thumbnailUrl!}
            alt="Video"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.32)",
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true" style={{ marginLeft: 3 }}>
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      {/* Caption — muted color */}
      {content.caption && (
        <p
          style={{
            textAlign: "center",
            margin: "0.75rem 0 0",
            fontSize: "0.875rem",
            fontStyle: "italic",
            color: tok.muted(theme),
          }}
        >
          {content.caption}
        </p>
      )}
    </SecWrap>
  );
}

// ── Wishing Well ─────────────────────────────────────────────────────────────

interface WishingProps {
  invitationId: string;
  initialWishes: InviteWish[];
  content: { placeholder?: string; title?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}

export function DbWishingSection({ invitationId, initialWishes, content: baseContent, theme: baseTheme }: WishingProps) {
  const content = useLangContent(baseContent);
  const theme = styled(baseTheme, content);
  const { wishes, name, setName, message, setMessage, submitting, submitted, error, handleSubmit } =
    useWishForm(invitationId, initialWishes);

  const bgImageUrl = (content as { backgroundImageUrl?: string }).backgroundImageUrl;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead label={content.title || "Wishes"} theme={theme} />}
      {bgImageUrl && (
        <img
          src={bgImageUrl}
          alt=""
          style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 10, marginBottom: "1rem" }}
        />
      )}

      {wishes.length > 0 && (
        <div
          style={{
            marginBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {wishes.map((w) => (
            <div
              key={w.id}
              style={{
                background: theme.cardBg,
                borderRadius: 10,
                padding: "1rem 1rem 0.875rem 1.125rem",
                border: `1px solid ${theme.border}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative large left-quote */}
              <div style={{
                position: "absolute", top: -4, left: 8,
                fontSize: "3.5rem", lineHeight: 1, fontFamily: "Georgia, serif",
                color: tok.header(theme), opacity: 0.15, userSelect: "none", pointerEvents: "none",
              }}>&ldquo;</div>
              <p
                style={{
                  margin: "0 0 0.5rem",
                  fontStyle: "italic",
                  fontSize: remScale(0.9375, tok.bs(theme)),
                  lineHeight: 1.65,
                  color: tok.body(theme),
                  position: "relative",
                }}
              >
                {w.message}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 16, height: 1, background: tok.header(theme), opacity: 0.5 }} />
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.5625rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: tok.header(theme),
                  }}
                >
                  {w.guestName}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!submitted ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: theme.cardBg,
              color: tok.body(theme),
              fontFamily: theme.font,
              fontSize: remScale(0.9375, tok.bs(theme)),
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={content.placeholder || "Leave your wishes here…"}
            required
            rows={4}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: theme.cardBg,
              color: tok.body(theme),
              fontFamily: theme.font,
              fontSize: remScale(0.9375, tok.bs(theme)),
              resize: "none",
              boxSizing: "border-box",
              outline: "none",
              lineHeight: 1.65,
            }}
          />
          {error && <p style={{ color: "#f87171", fontSize: "0.8rem", margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "0.8rem",
              borderRadius: 8,
              border: "none",
              background: theme.btnBg,
              color: theme.btnText,
              fontFamily: theme.font,
              fontSize: remScale(0.9375, tok.bs(theme)),
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: submitting ? 0.65 : 1,
              marginTop: "0.125rem",
            }}
          >
            {submitting ? "Sending…" : "Send Wishes"}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <p style={{ margin: "0 0 0.25rem", color: theme.accent, fontStyle: "italic", fontSize: remScale(1.0625, tok.bs(theme)) }}>
            Thank you for your wishes
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", marginTop: "0.75rem" }}>
            <div style={{ width: 24, height: 1, background: tok.header(theme), opacity: 0.35 }} />
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: tok.header(theme), opacity: 0.5 }} />
            <div style={{ width: 24, height: 1, background: tok.header(theme), opacity: 0.35 }} />
          </div>
        </div>
      )}
    </SecWrap>
  );
}

// ── KHQR ──────────────────────────────────────────────────────────────────────

interface KhqrProps {
  content: KhqrContent;
  theme: ThemeTokens;
}

export function DbKhqrSection({ content: baseContent, theme: baseTheme }: KhqrProps) {
  const content = useLangContent(baseContent);
  const theme = styled(baseTheme, content);
  const items = khqrItems(content);
  if (items.length === 0) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead label={content.title || "Contribution"} theme={theme} />}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            {/* QR frame */}
            <div style={{ position: "relative" }}>
              <div style={{
                padding: 12,
                borderRadius: 16,
                background: "#ffffff",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                border: `2px solid ${tok.header(theme)}22`,
              }}>
                <img src={item.qrImageUrl} alt={`${item.currency || "Payment"} QR`} width={188} height={188} style={{ display: "block", borderRadius: 8 }} />
              </div>
              {/* Currency badge */}
              {item.currency && (
                <div style={{
                  position: "absolute",
                  bottom: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "0.2rem 0.75rem",
                  borderRadius: 999,
                  background: tok.header(theme),
                  color: theme.bg === "transparent" ? "#fff" : theme.bg,
                  fontSize: "0.5625rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}>
                  {item.currency}
                </div>
              )}
            </div>
            <div style={{ textAlign: "center", marginTop: item.currency ? "0.625rem" : 0 }}>
              {item.recipientName && (
                <p style={{ margin: "0 0 0.25rem", fontSize: remScale(1.0625, tok.bs(theme)), fontWeight: 500, color: tok.body(theme) }}>
                  {item.recipientName}
                </p>
              )}
              {item.amount && (
                <p style={{ margin: 0, fontSize: remScale(1.125, tok.bs(theme)), fontWeight: 700, color: theme.accent, letterSpacing: "0.04em" }}>
                  {item.currency || "USD"} {item.amount}
                </p>
              )}
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
            <div style={{ flex: 1, height: 1, background: tok.header(theme), opacity: 0.2 }} />
            <p style={{ margin: 0, fontSize: "0.625rem", letterSpacing: "0.1em", textTransform: "uppercase", color: tok.muted(theme) }}>
              Scan with your banking app
            </p>
            <div style={{ flex: 1, height: 1, background: tok.header(theme), opacity: 0.2 }} />
          </div>
        </div>
      </div>
    </SecWrap>
  );
}

// The DB section renderer map lives in ./db-section-map (a non-"use client"
// module) so it stays a real, spreadable object when imported by the server
// component. See that file for why it cannot be defined here.
