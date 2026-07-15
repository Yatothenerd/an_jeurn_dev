"use client";

// Sweet Hearts bespoke section renderers. Every renderer is DB-driven: it
// receives the Section.content JSON plus event/photo/wish data the invite page
// loads from Prisma, so the design updates whenever the stored data changes.

import { useState } from "react";
import type { InviteWish } from "@/lib/utils/invite-cache";
import type { ThemeTokens } from "../../types";
import { useCountdown } from "../../shared/use-countdown";
import { useWishForm } from "../../shared/use-wish-form";
import { PhotoLightbox } from "../../shared/PhotoLightbox";
import { getMonthCalendar } from "../../shared/month-calendar";

// ── Doodle bits ────────────────────────────────────────────────────────────────

const HEART_PATH =
  "M50 82 C22 60 6 42 6 26 C6 12 17 4 29 4 C38 4 46 9 50 17 C54 9 62 4 71 4 C83 4 94 12 94 26 C94 42 78 60 50 82 Z";

function Heart({
  fill = "#f9c9d6",
  stroke = "#d64545",
  dashed = false,
  className,
  style,
}: {
  fill?: string;
  stroke?: string;
  dashed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 100 90" className={className} style={style} aria-hidden="true">
      <path
        d={HEART_PATH}
        fill={fill}
        stroke={stroke}
        strokeWidth={4}
        strokeDasharray={dashed ? "6 5" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Row of hearts hanging on strings with little bows (cover header). */
function HangingHearts() {
  const drops = [26, 52, 34, 60];
  return (
    <svg viewBox="0 0 300 120" className="sh-hang" aria-hidden="true">
      {drops.map((y, i) => {
        const x = 40 + i * 74;
        return (
          <g key={i}>
            <line x1={x} y1={0} x2={x} y2={y} stroke="#d64545" strokeWidth={1.6} />
            <path
              d="M-6 -2 C-10 -8 -2 -8 0 -3 C2 -8 10 -8 6 -2 C10 4 2 4 0 0 C-2 4 -10 4 -6 -2 Z"
              transform={`translate(${x} ${y - 2}) scale(0.9)`}
              fill="#f7a8c4"
              stroke="#d64545"
              strokeWidth={1.2}
            />
            <path
              d={HEART_PATH}
              transform={`translate(${x - 17} ${y}) scale(0.34)`}
              fill={i % 2 ? "#fbdce4" : "#f9c9d6"}
              stroke="#d64545"
              strokeWidth={7}
              strokeDasharray="8 7"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Wavy hand-drawn divider line. */
function Squiggle() {
  return (
    <svg viewBox="0 0 120 14" className="sh-squiggle" aria-hidden="true">
      <path
        d="M4 8 Q14 2 24 8 T44 8 T64 8 T84 8 T104 8 T116 8"
        fill="none"
        stroke="#e8788f"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Scalloped lace heart used as the cover photo frame. */
function LaceHeartFrame({ photo }: { photo?: string }) {
  return (
    <div className="sh-heartframe">
      <svg viewBox="0 0 100 90" className="frame" aria-hidden="true">
        <path d={HEART_PATH} fill="#fbdce4" stroke="#d64545" strokeWidth={2.4} strokeDasharray="4 3" strokeLinecap="round" />
        <path
          d={HEART_PATH}
          transform="translate(6 5.4) scale(0.88)"
          fill="none"
          stroke="#e8788f"
          strokeWidth={1.4}
          strokeDasharray="1.5 3"
          strokeLinecap="round"
        />
      </svg>
      {photo && <img className="photo" src={photo} alt="" />}
    </div>
  );
}

// ── Cover ──────────────────────────────────────────────────────────────────────

interface ShCoverContent {
  heading?: string;
  subheading?: string;
  bigWord?: string;
  guestLabel?: string;
  imageUrl?: string;
}

export function ShCover({
  content,
  eventTitle,
  eventDate,
  venueName,
  guestName,
  assets,
}: {
  content: ShCoverContent;
  eventTitle: string;
  eventDate: string;
  venueName?: string | null;
  guestName?: string | null;
  theme: ThemeTokens;
  assets?: Record<string, string>;
}) {
  const photo = content.imageUrl || assets?.cover;
  const formatted = new Date(eventDate).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="sh-cover">
      <HangingHearts />
      {content.subheading && <p className="sh-cover-line">{content.subheading}</p>}
      <h1 className="sh-cover-big">{content.bigWord || "wedding"}</h1>
      <LaceHeartFrame photo={photo} />
      <div className="sh-pill">{content.heading || eventTitle}</div>
      <p className="sh-small">
        {formatted}
        {venueName ? ` · ${venueName}` : ""}
      </p>
      {guestName && <div className="sh-guest">{content.guestLabel || "Dear"} {guestName} ♥</div>}
    </div>
  );
}

// ── Wording (free text) ────────────────────────────────────────────────────────

export function ShWording({
  content,
}: {
  content: { title?: string; text?: string; imageUrl?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  const paragraphs = (content.text ?? "").split(/\n+/).filter(Boolean);
  return (
    <div>
      {!content.hideTitle && content.title && <h3 className="sh-title">{content.title}</h3>}
      <Squiggle />
      {paragraphs.map((p, i) => (
        <p key={i} className="sh-body">{p}</p>
      ))}
      {content.imageUrl && (
        <div className="sh-polaroids">
          <div className="sh-polaroid">
            <span className="bow">🎀</span>
            <img src={content.imageUrl} alt="" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Countdown → "When?" calendar with the day circled ─────────────────────────

export function ShCountdown({
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

  return (
    <div>
      {!hideTitle && <h3 className="sh-title">{label || "When?"}</h3>}
      <Squiggle />
      <div className="sh-cal">
        <div className="sh-cal-month">
          <span>{monthName}</span>
          <span>|</span>
          <b>{year}</b>
        </div>
        <div className="sh-cal-grid">
          {cells.map((n, i) =>
            n === null ? (
              <span key={i} />
            ) : (
              <span key={i} className={`sh-cal-day${n === day ? " on" : ""}`}>{n}</span>
            )
          )}
        </div>
        <p className="sh-cal-count">
          {time.expired ? "The day is here! ♥" : `${time.days} days · ${time.hours} hrs · ${time.minutes} min to go`}
        </p>
      </div>
    </div>
  );
}

// ── Agenda → "What time?" squiggly timeline ────────────────────────────────────

interface ShAgendaItem {
  time?: string;
  title?: string;
  titleEn?: string;
}

function TimelineCurve({ flip }: { flip: boolean }) {
  return (
    <svg viewBox="0 0 110 56" className="sh-tl-curve" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <path
        d="M18 4 C 86 12, 24 42, 92 52"
        fill="none"
        stroke="#d64545"
        strokeWidth={2}
        strokeDasharray="1 6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShAgenda({
  content,
}: {
  content: { title?: string; subtitle?: string; items?: ShAgendaItem[]; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  return (
    <div>
      {!content.hideTitle && <h3 className="sh-title">{content.title || "What time?"}</h3>}
      {content.subtitle && <p className="sh-small">{content.subtitle}</p>}
      <Squiggle />
      <div className="sh-tl">
        <Heart className="sh-tl-deco" style={{ top: "8%", right: 0 }} fill="#f9c9d6" />
        <Heart className="sh-tl-deco" style={{ bottom: "10%", left: 0 }} fill="#fbdce4" dashed />
        {items.map((item, i) => (
          <div key={i}>
            <div className={`sh-tl-row ${i % 2 ? "right" : "left"}`}>
              <p className="sh-tl-time">{item.time}</p>
              {(item.title || item.titleEn) && <p className="sh-tl-name">{item.title || item.titleEn}</p>}
            </div>
            {i < items.length - 1 && <TimelineCurve flip={i % 2 === 1} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Details → "Where?", dress code hearts, oval notes ─────────────────────────

interface ShDetailItem { icon?: string; label?: string; value?: string }

export function ShDetails({
  content,
  venueName,
  venueMapUrl,
}: {
  content: {
    title?: string;
    hideTitle?: boolean;
    items?: ShDetailItem[];
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
      {!content.hideTitle && <h3 className="sh-title">📍 {content.title || "Where?"}</h3>}
      <Squiggle />
      {venueName && <p className="sh-body">{venueName}</p>}
      {items.map((item, i) => (
        <p key={i} className="sh-body">
          {item.label ? <span className="sh-small" style={{ display: "block" }}>{item.label}</span> : null}
          {item.value}
        </p>
      ))}
      {photo && <img className="sh-photo-card" src={photo} alt="" />}
      {mapUrl && (
        <p className="sh-center" style={{ margin: "0.4rem 0 0" }}>
          <a className="sh-btn" href={mapUrl} target="_blank" rel="noreferrer">
            {content.mapLabel || "open map"}
          </a>
        </p>
      )}

      {content.dresscode && content.dresscode.length > 0 && (
        <div style={{ marginTop: "1.6rem" }}>
          <h3 className="sh-title">{content.dresscodeLabel || "Dress code"}</h3>
          {content.dresscodeText && <p className="sh-body">{content.dresscodeText}</p>}
          <div className="sh-dress">
            {content.dresscode.map((c, i) => (
              <Heart key={i} fill={c} stroke="transparent" />
            ))}
          </div>
        </div>
      )}

      {content.notes && content.notes.length > 0 && (
        <div style={{ marginTop: "1.6rem" }}>
          <h3 className="sh-title">{content.notesLabel || "Details"}</h3>
          <div className="sh-notes">
            {content.notes.map((n, i) => (
              <div key={i} className="sh-note">
                <span className="bow">🎀</span>
                {n}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gallery → tilted polaroids ─────────────────────────────────────────────────

interface ShPhoto { id: string; url: string; sortOrder: number }

export function ShGallery({
  content,
  photos,
}: {
  content: { title?: string; layout?: string; hideTitle?: boolean };
  photos: ShPhoto[];
  theme: ThemeTokens;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (photos.length === 0) return null;

  return (
    <div>
      {!content.hideTitle && <h3 className="sh-title">{content.title || "Our moments"}</h3>}
      <Squiggle />
      <div className="sh-polaroids">
        {photos.map((p) => (
          <div key={p.id} className="sh-polaroid" onClick={() => setLightbox(p.url)} style={{ cursor: "zoom-in" }}>
            <span className="bow">🎀</span>
            <img src={p.url} alt="" />
          </div>
        ))}
      </div>
      {lightbox && <PhotoLightbox url={lightbox} onClose={() => setLightbox(null)} overlayColor="rgba(60, 10, 25, 0.88)" />}
    </div>
  );
}

// ── KHQR ───────────────────────────────────────────────────────────────────────

export function ShKhqr({
  content,
}: {
  content: { title?: string; recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  if (!content.qrImageUrl) return null;
  return (
    <div>
      {!content.hideTitle && <h3 className="sh-title">{content.title || "A gift from the heart"}</h3>}
      <Squiggle />
      <p className="sh-body">Instead of flowers, you may send a little love here:</p>
      <img className="sh-qr" src={content.qrImageUrl} alt="KHQR" />
      {content.recipientName && <p className="sh-body" style={{ marginTop: "0.6rem" }}>{content.recipientName}</p>}
    </div>
  );
}

// ── Wishing wall ───────────────────────────────────────────────────────────────

export function ShWishing({
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
      {!content.hideTitle && <h3 className="sh-title">{content.title || "We love you so much!"}</h3>}
      <Squiggle />
      <p className="sh-body">Leave us a few warm words 💌</p>
      <form onSubmit={handleSubmit} className="inv-wish-form">
        <input
          className="sh-wish-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
        <input
          className="sh-wish-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={content.placeholder || "Your wishes…"}
          required
        />
        {error && <p style={{ margin: 0, color: "#c0392b", fontSize: "0.95rem", textAlign: "center" }}>{error}</p>}
        {submitted && <p style={{ margin: 0, color: "#d64545", fontSize: "0.95rem", textAlign: "center" }}>Sent! 💌</p>}
        <button className="sh-wish-send" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send with love ♥"}
        </button>
      </form>
      {wishes.length > 0 && (
        <div style={{ marginTop: "1.1rem" }}>
          {wishes.slice(0, 6).map((w) => (
            <div key={w.id} className="sh-wish-card">
              <p className="sh-wish-msg">&ldquo;{w.message}&rdquo;</p>
              <p className="sh-wish-from">— {w.guestName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Footer hearts (used by the layout) ─────────────────────────────────────────

export function ShFooterHearts() {
  const fills = ["#f9c9d6", "#d64545", "#fbdce4"];
  return (
    <div className="sh-foot-hearts">
      {fills.map((f, i) => (
        <Heart key={i} fill={f} stroke={f === "#d64545" ? "transparent" : "#d64545"} dashed={i === 2} />
      ))}
    </div>
  );
}

