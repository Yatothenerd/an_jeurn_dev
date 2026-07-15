"use client";

// Minimal Floral bespoke section renderers. Every renderer is DB-driven: it
// receives the Section.content JSON plus event/photo/wish data the invite page
// loads from Prisma, so the design updates whenever the stored data changes.
// Content shapes deliberately mirror the other bespoke themes (Sweet Hearts)
// field-for-field so the existing generic admin content forms work unmodified.

import { useState } from "react";
import type { InviteWish } from "@/lib/utils/invite-cache";
import type { ThemeTokens } from "../../types";
import { useCountdown } from "../../shared/use-countdown";
import { useWishForm } from "../../shared/use-wish-form";
import { getMonthCalendar } from "../../shared/month-calendar";

// ── Hand-drawn floral bits ──────────────────────────────────────────────────────

/** A simple 5-petal blossom, centered at the origin (~28x28 unit footprint). */
function BlossomShape({
  fill = "#f4ede1",
  stroke = "#9c8768",
  center = "#c9a25a",
}: {
  fill?: string;
  stroke?: string;
  center?: string;
}) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <g>
      {petals.map((a) => (
        <ellipse key={a} cx="0" cy="-6.5" rx="4.4" ry="7" fill={fill} stroke={stroke} strokeWidth={0.6} transform={`rotate(${a})`} />
      ))}
      <circle r={2.6} fill={center} />
    </g>
  );
}

/** A small teardrop leaf, centered at the origin, pointing up. */
function LeafShape({ fill = "#8a9a72", stroke = "#677750" }: { fill?: string; stroke?: string }) {
  return (
    <g>
      <path d="M0 -10 C 6 -6 6 6 0 10 C -6 6 -6 -6 0 -10 Z" fill={fill} stroke={stroke} strokeWidth={0.8} />
      <line x1="0" y1="-8" x2="0" y2="8" stroke={stroke} strokeWidth={0.6} />
    </g>
  );
}

/** Standalone single blossom, for inline use (dividers, bullets, footer). */
function Blossom({
  size = 20,
  fill,
  stroke,
  center,
  className,
}: {
  size?: number;
  fill?: string;
  stroke?: string;
  center?: string;
  className?: string;
}) {
  return (
    <svg viewBox="-14 -14 28 28" width={size} height={size} className={className} aria-hidden="true">
      <BlossomShape fill={fill} stroke={stroke} center={center} />
    </svg>
  );
}

/** Minimal continuous-line bird silhouette — used for the dress-code palette swatches. */
function Bird({ size = 30, fill = "#e0a9a0" }: { size?: number; fill?: string }) {
  return (
    <svg viewBox="0 0 40 32" width={size} aria-hidden="true">
      <path
        d="M4 22 C 3 12 13 5 22 7 C 20 4 23 1 27 2 C 25 5 26 8 24 9 C 33 9 38 15 36 21 C 30 17 25 17 21 19 C 15 24 8 25 4 22 Z"
        fill={fill}
      />
      <circle cx="25" cy="7.5" r={1.1} fill="#4a4038" />
    </svg>
  );
}

/** Corner spray — a curved stem with a few blossoms and leaves. Mirror with `flip`. */
function FloralCorner({ flip = false, width = 76 }: { flip?: boolean; width?: number }) {
  return (
    <svg viewBox="0 0 90 76" width={width} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <path d="M6 70 C 14 48 10 28 28 8" fill="none" stroke="#9c8768" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M16 42 C 24 38 27 30 25 22" fill="none" stroke="#9c8768" strokeWidth={1} strokeLinecap="round" />
      <g transform="translate(28 8) scale(0.85)"><BlossomShape /></g>
      <g transform="translate(25 22) rotate(35) scale(0.6)"><LeafShape /></g>
      <g transform="translate(16 42) scale(0.6)"><BlossomShape fill="#efd9c9" /></g>
      <g transform="translate(10 30) rotate(-30) scale(0.55)"><LeafShape /></g>
      <g transform="translate(6 68) scale(0.7)"><BlossomShape fill="#f6e9dd" /></g>
    </svg>
  );
}

/** Small centered floral cluster for the top of the in-flow cover recap. */
function FloralHeader() {
  return (
    <svg viewBox="0 0 160 46" className="mf-cover-floral" aria-hidden="true">
      <path d="M20 40 C 40 20 60 34 80 14 C 100 34 120 20 140 40" fill="none" stroke="#9c8768" strokeWidth={1.1} strokeLinecap="round" />
      <g transform="translate(20 40) scale(0.6)"><BlossomShape /></g>
      <g transform="translate(80 14) scale(0.9)"><BlossomShape fill="#efd9c9" /></g>
      <g transform="translate(140 40) scale(0.6)"><BlossomShape /></g>
      <g transform="translate(50 24) rotate(20) scale(0.55)"><LeafShape /></g>
      <g transform="translate(110 24) rotate(-20) scale(0.55)"><LeafShape /></g>
    </svg>
  );
}

/** Thin rule + small blossom — opens every non-cover section (Squiggle equivalent). */
function FloralDivider() {
  return (
    <svg viewBox="0 0 120 16" className="mf-divider" aria-hidden="true">
      <line x1="4" y1="8" x2="48" y2="8" stroke="#c9b491" strokeWidth={1} />
      <g transform="translate(60 8) scale(0.6)"><BlossomShape /></g>
      <line x1="72" y1="8" x2="116" y2="8" stroke="#c9b491" strokeWidth={1} />
    </svg>
  );
}

// ── Cover ──────────────────────────────────────────────────────────────────────

interface MfCoverContent {
  heading?: string;
  subheading?: string;
  guestLabel?: string;
  imageUrl?: string;
}

export function MfCover({
  content,
  eventTitle,
  eventDate,
  venueName,
  guestName,
}: {
  content: MfCoverContent;
  eventTitle: string;
  eventDate: string;
  venueName?: string | null;
  guestName?: string | null;
  theme: ThemeTokens;
  assets?: Record<string, string>;
}) {
  const formatted = new Date(eventDate).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mf-cover">
      <FloralHeader />
      {content.subheading && <p className="mf-pretitle">{content.subheading}</p>}
      <h1 className="mf-names">{content.heading || eventTitle}</h1>
      <div className="mf-rule">
        <span className="line" />
        <Blossom size={16} />
        <span className="line" />
      </div>
      <p className="mf-meta">
        {formatted}
        {venueName ? ` · ${venueName}` : ""}
      </p>
      {guestName && (
        <div className="mf-guest">
          {content.guestLabel || "Dear"} {guestName}
        </div>
      )}
    </div>
  );
}

// ── Wording (free text) ────────────────────────────────────────────────────────

export function MfWording({
  content,
}: {
  content: { title?: string; text?: string; imageUrl?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  const paragraphs = (content.text ?? "").split(/\n+/).filter(Boolean);
  return (
    <div>
      {!content.hideTitle && content.title && <h3 className="mf-title">{content.title}</h3>}
      <FloralDivider />
      {paragraphs.map((p, i) => (
        <p key={i} className="mf-body">{p}</p>
      ))}
      {content.imageUrl && <img className="mf-photo" src={content.imageUrl} alt="" />}
    </div>
  );
}

// ── Countdown → calendar month grid + live ticking countdown ──────────────────

export function MfCountdown({
  targetDate,
  label,
  eventDate,
  hideTitle,
}: {
  targetDate: string;
  label?: string;
  eventDate: string;
  theme: ThemeTokens;
  hideTitle?: boolean;
}) {
  const time = useCountdown(targetDate, eventDate);
  const { year, day, monthName, cells } = getMonthCalendar(targetDate, eventDate);
  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  const units = [
    { l: "days", v: time.days },
    { l: "hrs", v: time.hours },
    { l: "min", v: time.minutes },
    { l: "sec", v: time.seconds },
  ];

  return (
    <div>
      {!hideTitle && <h3 className="mf-title">{label || "Save the date"}</h3>}
      <FloralDivider />
      <div className="mf-cal">
        <div className="mf-cal-month">
          <span>{monthName}</span>
          <b>{year}</b>
        </div>
        <div className="mf-cal-week">
          {weekdays.map((w, i) => <span key={i}>{w}</span>)}
        </div>
        <div className="mf-cal-grid">
          {cells.map((n, i) =>
            n === null ? (
              <span key={i} />
            ) : (
              <span key={i} className={`mf-cal-day${n === day ? " on" : ""}`}>{n}</span>
            )
          )}
        </div>
      </div>
      {!time.expired ? (
        <div className="mf-count">
          {units.map(({ l, v }) => (
            <div key={l} className="mf-count-cell">
              <span className="num">{String(v).padStart(2, "0")}</span>
              <span className="lbl">{l}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mf-body">The day has arrived ❀</p>
      )}
    </div>
  );
}

// ── Agenda → floral-beaded timeline ────────────────────────────────────────────

interface MfAgendaItem {
  time?: string;
  title?: string;
  titleEn?: string;
}

export function MfAgenda({
  content,
}: {
  content: { title?: string; subtitle?: string; items?: MfAgendaItem[]; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  return (
    <div>
      {!content.hideTitle && <h3 className="mf-title">{content.title || "Schedule"}</h3>}
      {content.subtitle && <p className="mf-small">{content.subtitle}</p>}
      <FloralDivider />
      <div className="mf-tl">
        {items.map((item, i) => (
          <div key={i} className="mf-tl-row">
            <div className="mf-tl-marker"><Blossom size={16} /></div>
            <div className="mf-tl-body">
              <p className="mf-tl-time">{item.time}</p>
              {(item.title || item.titleEn) && <p className="mf-tl-name">{item.title || item.titleEn}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Details → venue / map, dress-code birds, note bubbles ─────────────────────

interface MfDetailItem { icon?: string; label?: string; value?: string }

export function MfDetails({
  content,
  venueName,
  venueMapUrl,
}: {
  content: {
    title?: string;
    hideTitle?: boolean;
    items?: MfDetailItem[];
    imageUrl?: string;
    bgUrl?: string;
    photoItems?: Array<{ imageUrl?: string; caption?: string }>;
    mapUrl?: string;
    mapLabel?: string;
    dresscodeLabel?: string;
    dresscodeText?: string;
    dresscode?: string[];
    notesLabel?: string;
    notes?: string[];
  };
  venueName: string | null;
  venueMapUrl: string | null;
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  const photo = content.imageUrl || content.bgUrl || content.photoItems?.[0]?.imageUrl;
  const mapUrl = content.mapUrl || venueMapUrl;

  return (
    <div>
      {!content.hideTitle && <h3 className="mf-title">{content.title || "Location"}</h3>}
      <FloralDivider />
      {venueName && <p className="mf-body">{venueName}</p>}
      {items.map((item, i) => (
        <p key={i} className="mf-body">
          {item.label ? <span className="mf-small" style={{ display: "block" }}>{item.label}</span> : null}
          {item.value}
        </p>
      ))}
      {photo && <img className="mf-photo" src={photo} alt="" />}
      {mapUrl && (
        <p className="mf-center" style={{ margin: "0.5rem 0 0" }}>
          <a className="mf-btn" href={mapUrl} target="_blank" rel="noreferrer">
            {content.mapLabel || "View on map"}
          </a>
        </p>
      )}

      {content.dresscode && content.dresscode.length > 0 && (
        <div className="mf-block">
          <h3 className="mf-title">{content.dresscodeLabel || "Wishes"}</h3>
          {content.dresscodeText && <p className="mf-body">{content.dresscodeText}</p>}
          <div className="mf-dress">
            {content.dresscode.map((c, i) => <Bird key={i} fill={c} />)}
          </div>
        </div>
      )}

      {content.notes && content.notes.length > 0 && (
        <div className="mf-block">
          <h3 className="mf-title">{content.notesLabel || "Notes"}</h3>
          <div className="mf-notes">
            {content.notes.map((n, i) => (
              <div key={i} className="mf-note">
                <Blossom size={13} />
                <span>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gallery → simple photo grid ────────────────────────────────────────────────

interface MfPhoto { id: string; url: string; sortOrder: number }

export function MfGallery({
  content,
  photos,
}: {
  content: { title?: string; hideTitle?: boolean };
  photos: MfPhoto[];
  theme: ThemeTokens;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (photos.length === 0) return null;

  return (
    <div>
      {!content.hideTitle && <h3 className="mf-title">{content.title || "Our moments"}</h3>}
      <FloralDivider />
      <div className="mf-gallery">
        {photos.map((p) => (
          <div key={p.id} className="mf-galitem" onClick={() => setLightbox(p.url)} style={{ cursor: "zoom-in" }}>
            <img src={p.url} alt="" />
          </div>
        ))}
      </div>
      {lightbox && (
        <div className="mf-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ── KHQR ───────────────────────────────────────────────────────────────────────

export function MfKhqr({
  content,
}: {
  content: { title?: string; recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  if (!content.qrImageUrl) return null;
  return (
    <div>
      {!content.hideTitle && <h3 className="mf-title">{content.title || "A gift from the heart"}</h3>}
      <FloralDivider />
      <p className="mf-body">Instead of flowers, you may send a little love here:</p>
      <img className="mf-qr" src={content.qrImageUrl} alt="KHQR" />
      {content.recipientName && <p className="mf-body" style={{ marginTop: "0.6rem" }}>{content.recipientName}</p>}
    </div>
  );
}

// ── Wishing wall ───────────────────────────────────────────────────────────────

export function MfWishing({
  invitationId,
  initialWishes,
  content,
}: {
  invitationId: string;
  initialWishes: InviteWish[];
  content: { title?: string; placeholder?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  const { wishes, name, setName, message, setMessage, submitting, submitted, error, handleSubmit } = useWishForm(
    invitationId,
    initialWishes
  );

  return (
    <div>
      {!content.hideTitle && <h3 className="mf-title">{content.title || "Leave us a wish"}</h3>}
      <FloralDivider />
      <form onSubmit={handleSubmit} className="inv-wish-form">
        <input
          className="mf-wish-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
        <input
          className="mf-wish-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={content.placeholder || "Your wishes…"}
          required
        />
        {error && <p style={{ margin: 0, color: "#b0522f", fontSize: "0.95rem", textAlign: "center" }}>{error}</p>}
        {submitted && <p style={{ margin: 0, color: "#7c6142", fontSize: "0.95rem", textAlign: "center" }}>Sent ❀</p>}
        <button className="mf-wish-send" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send"}
        </button>
      </form>
      {wishes.length > 0 && (
        <div style={{ marginTop: "1.1rem" }}>
          {wishes.slice(0, 6).map((w) => (
            <div key={w.id} className="mf-wish-card">
              <p className="mf-wish-msg">&ldquo;{w.message}&rdquo;</p>
              <p className="mf-wish-from">— {w.guestName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gate decoration + footer (used by index.ts / layout.tsx) ──────────────────

export function MfGateDecoration() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%", maxWidth: 380, padding: "1.3rem 1.4rem 0", opacity: 0.95 }}>
      <FloralCorner />
      <FloralCorner flip />
    </div>
  );
}

export function MfFooterFloral() {
  return (
    <div className="mf-foot-floral">
      <Blossom size={16} />
      <Blossom size={24} fill="#efd9c9" />
      <Blossom size={16} />
    </div>
  );
}
