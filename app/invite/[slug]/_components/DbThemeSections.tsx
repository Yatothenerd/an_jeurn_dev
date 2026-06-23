"use client";

import { useCountdown } from "@/lib/themes/shared/use-countdown";
import { useWishForm } from "@/lib/themes/shared/use-wish-form";
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
  hs:       (t: ThemeTokens) => t.headingScale ?? 1,
  bs:       (t: ThemeTokens) => t.bodyScale ?? 1,
};

/** Scale a rem size by a multiplier, e.g. remScale(1.875, theme.headingScale). */
const remScale = (base: number, scale = 1) => `${+(base * scale).toFixed(4)}rem`;

// ── Shared primitives ─────────────────────────────────────────────────────────

function SecWrap({ children, theme }: { children: React.ReactNode; theme: ThemeTokens }) {
  return (
    <section
      style={{
        padding: "3.25rem 1.75rem",
        borderTop: `1px solid ${theme.border}`,
        fontFamily: theme.font,
        fontSize: remScale(1, tok.bs(theme)),
        color: tok.body(theme),
      }}
    >
      <div style={{ maxWidth: 400, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function SecHead({ icon, label, theme }: { icon: string; label: string; theme: ThemeTokens }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
      <div style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>{icon}</div>
      <p
        style={{
          margin: 0,
          fontSize: remScale(0.5625, tok.hs(theme)),
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontFamily: tok.heading(theme),
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

export function DbCoverSection({ content, eventTitle, eventDate, venueName, guestName, theme, assets }: CoverProps) {
  const formatted = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // The cover photo lives on the landing gate (Invitation.coverUrl is mirrored
  // from this section's image). Showing it again here is pure duplication, so the
  // cover section never renders the hero photo — only an optional monogram.
  const monogramUrl = theme.showMonogramInSections ? (content.logoUrl ?? assets?.cover) : null;

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "5rem 1.75rem 4rem",
        fontFamily: theme.font,
        color: tok.body(theme),
        background: theme.coverGradient,
      }}
    >
      {monogramUrl && (
        <img
          src={monogramUrl}
          alt="Monogram"
          style={{
            width: 104,
            height: 104,
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

// ── Countdown ─────────────────────────────────────────────────────────────────

interface CountdownProps {
  targetDate: string;
  label?: string;
  eventDate: string;
  theme: ThemeTokens;
  hideTitle?: boolean;
}

export function DbCountdownSection({ targetDate, label, eventDate, theme, hideTitle }: CountdownProps) {
  const time = useCountdown(targetDate, eventDate);

  return (
    <SecWrap theme={theme}>
      {!hideTitle && <SecHead icon="⏳" label={label || "Countdown"} theme={theme} />}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          {[
            { v: time.days, l: "Days" },
            { v: time.hours, l: "Hours" },
            { v: time.minutes, l: "Mins" },
            { v: time.seconds, l: "Secs" },
          ].map(({ v, l }) => (
            <div
              key={l}
              style={{
                textAlign: "center",
                background: theme.cardBg,
                borderRadius: 10,
                padding: "0.875rem 0.25rem",
                border: `1px solid ${theme.border}`,
              }}
            >
              {/* Number digit — title weight */}
              <div
                style={{
                  fontSize: remScale(1.875, tok.hs(theme)),
                  fontWeight: 700,
                  lineHeight: 1,
                  fontFamily: tok.heading(theme),
                  color: tok.title(theme),
                }}
              >
                {String(v).padStart(2, "0")}
              </div>
              {/* Unit label — header color */}
              <div
                style={{
                  fontSize: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: "0.3rem",
                  color: tok.header(theme),
                }}
              >
                {l}
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

export function DbDetailsSection({ content, venueName, venueMapUrl, theme }: DetailsProps) {
  // Only show photo items that actually have an uploaded image (imageUrl non-empty)
  const photoItems = (content.photoItems ?? []).filter((it) => it.imageUrl);
  // Only show text items that have a non-empty value (ignore placeholder rows with value:"")
  const textItems: DetailItem[] = (content.items ?? []).filter((it) => it.value && it.value.trim() !== "");

  const hasVenueRow = textItems.some((it) => it.label.toLowerCase().includes("venue"));
  if (venueName && !hasVenueRow) textItems.push({ icon: "📍", label: "Venue", value: venueName });

  if (photoItems.length === 0 && textItems.length === 0 && !venueMapUrl) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead icon="📋" label={content.title || "Details"} theme={theme} />}

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
                      fontSize: "2rem",
                      opacity: 0.3,
                    }}
                  >
                    🖼
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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {textItems.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.875rem",
                background: theme.cardBg,
                borderRadius: 10,
                padding: "0.875rem 1rem",
                border: `1px solid ${theme.border}`,
              }}
            >
              {row.icon && (
                <span style={{ fontSize: "1.125rem", flexShrink: 0, lineHeight: 1.4 }}>{row.icon}</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Row label — header color */}
                <div
                  style={{
                    fontSize: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "0.2rem",
                    color: tok.header(theme),
                  }}
                >
                  {row.label}
                </div>
                {/* Row value — body color */}
                <div style={{ fontSize: "0.9375rem", wordBreak: "break-word", color: tok.body(theme) }}>
                  {row.value || "—"}
                </div>
              </div>
            </div>
          ))}
          {venueMapUrl && (
            <a
              href={venueMapUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.875rem",
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: theme.cardBg,
                color: theme.accent,
                textDecoration: "none",
                fontSize: "0.875rem",
                letterSpacing: "0.05em",
              }}
            >
              🗺 Open in Maps
            </a>
          )}
        </div>
      )}
    </SecWrap>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

interface GalleryProps {
  content: { layout?: string; title?: string; hideTitle?: boolean };
  photos: Array<{ id: string; url: string; sortOrder: number }>;
  theme: ThemeTokens;
}

export function DbGallerySection({ content, photos, theme }: GalleryProps) {
  if (photos.length === 0) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead icon="🖼" label={content.title || "Gallery"} theme={theme} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
        {photos.map((p) => (
          <div
            key={p.id}
            style={{ position: "relative", paddingTop: "100%", borderRadius: 6, overflow: "hidden" }}
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

export function DbVideoSection({ content, theme }: VideoProps) {
  const thumbnailUrl = (content as { thumbnailUrl?: string }).thumbnailUrl;
  if (!content.url && !thumbnailUrl) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead icon="▶" label={content.title || "Video"} theme={theme} />}
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
        <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", position: "relative" }}>
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
              background: "rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
              }}
            >
              ▶
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

export function DbWishingSection({ invitationId, initialWishes, content, theme }: WishingProps) {
  const { wishes, name, setName, message, setMessage, submitting, submitted, error, handleSubmit } =
    useWishForm(invitationId, initialWishes);

  const bgImageUrl = (content as { backgroundImageUrl?: string }).backgroundImageUrl;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead icon="✨" label={content.title || "Wishes"} theme={theme} />}
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
            marginBottom: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.625rem",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {wishes.map((w) => (
            <div
              key={w.id}
              style={{
                background: theme.cardBg,
                borderRadius: 10,
                padding: "0.875rem 1rem",
                border: `1px solid ${theme.border}`,
              }}
            >
              {/* Wish body text */}
              <p
                style={{
                  margin: "0 0 0.375rem",
                  fontStyle: "italic",
                  fontSize: "0.9375rem",
                  lineHeight: 1.55,
                  color: tok.body(theme),
                }}
              >
                &ldquo;{w.message}&rdquo;
              </p>
              {/* Author — header/accent color */}
              <p
                style={{
                  margin: 0,
                  fontSize: "0.625rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: tok.header(theme),
                }}
              >
                — {w.guestName}
              </p>
            </div>
          ))}
        </div>
      )}

      {!submitted ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            style={{
              width: "100%",
              padding: "0.625rem 0.875rem",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: theme.cardBg,
              color: tok.body(theme),
              fontFamily: theme.font,
              fontSize: "0.9375rem",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={content.placeholder || "Leave your wishes here…"}
            required
            rows={3}
            style={{
              width: "100%",
              padding: "0.625rem 0.875rem",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: theme.cardBg,
              color: tok.body(theme),
              fontFamily: theme.font,
              fontSize: "0.9375rem",
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          {error && <p style={{ color: "#f87171", fontSize: "0.8rem", margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "0.7rem",
              borderRadius: 8,
              border: "none",
              background: theme.btnBg,
              color: theme.btnText,
              fontFamily: theme.font,
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.05em",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Sending…" : "Send Wish ✨"}
          </button>
        </form>
      ) : (
        <p style={{ textAlign: "center", color: theme.accent, fontStyle: "italic" }}>
          Thank you for your warm wishes! 💝
        </p>
      )}
    </SecWrap>
  );
}

// ── KHQR ──────────────────────────────────────────────────────────────────────

interface KhqrProps {
  content: KhqrContent;
  theme: ThemeTokens;
}

export function DbKhqrSection({ content, theme }: KhqrProps) {
  const items = khqrItems(content);
  if (items.length === 0) return null;

  return (
    <SecWrap theme={theme}>
      {!content.hideTitle && <SecHead icon="💳" label={content.title || "Contribution"} theme={theme} />}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            {item.currency && (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: tok.header(theme),
                }}
              >
                {item.currency}
              </p>
            )}
            <div style={{ padding: 8, borderRadius: 12, background: "#ffffff", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
              <img src={item.qrImageUrl} alt={`${item.currency || "Payment"} QR`} width={180} height={180} style={{ display: "block", borderRadius: 6 }} />
            </div>
            {item.recipientName && (
              <p style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, color: tok.body(theme) }}>{item.recipientName}</p>
            )}
            {item.amount && (
              <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: theme.accent }}>
                {item.currency || "USD"} {item.amount}
              </p>
            )}
          </div>
        ))}
        <p style={{ margin: 0, textAlign: "center", fontSize: "0.75rem", letterSpacing: "0.06em", color: tok.muted(theme) }}>
          Scan with your banking app
        </p>
      </div>
    </SecWrap>
  );
}

// The DB section renderer map lives in ./db-section-map (a non-"use client"
// module) so it stays a real, spreadable object when imported by the server
// component. See that file for why it cannot be defined here.
