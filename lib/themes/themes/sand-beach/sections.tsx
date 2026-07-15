"use client";

// Sand Beach bespoke section renderers — a dusty-blue & sand seaside theme:
// scalloped shells, a satin ribbon bow, a wave-squiggle divider, tilted
// polaroids, a hearted month calendar + digital countdown, and pearl dress
// code swatches. Every renderer is DB-driven: it receives the Section.content
// JSON plus event/photo/wish data the invite page loads from Prisma.

import { useState } from "react";
import type { InviteWish } from "@/lib/utils/invite-cache";
import type { ThemeTokens } from "../../types";
import { useCountdown } from "../../shared/use-countdown";
import { useWishForm } from "../../shared/use-wish-form";
import { PhotoLightbox } from "../../shared/PhotoLightbox";
import { getMonthCalendar } from "../../shared/month-calendar";

// ── Decorative line art ───────────────────────────────────────────────────────

export function SbShell({ className, size = 26 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 40 34" width={size} height={size * 0.85} className={className} aria-hidden="true">
      <path
        d="M20 2 C10 2 2 12 2 22 C2 26 5 28 8 26 C9 22 10 16 12 16 C13 22 14 26 16 26 C17 20 18 15 20 15 C22 15 23 20 24 26 C26 26 27 22 28 16 C30 16 31 22 32 26 C35 28 38 26 38 22 C38 12 30 2 20 2 Z"
        fill="#fdfaf3"
        stroke="#5b83ab"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ornate satin ribbon bow — layered loops with a sheen highlight, notched
 *  tails, and a pearl-set center knot. The theme's signature flourish. */
export function SbBow({ className, size = 64 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 90 68" width={size} height={size * (68 / 90)} className={className ?? "sb-bow"} aria-hidden="true">
      {/* tails */}
      <path d="M40 34 L31 60 L38 55 L41 62 L45 55 L52 60 L43 34 Z" fill="#e8dcc4" stroke="#5b83ab" strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M40 36 L34 56 M45 36 L49 56" fill="none" stroke="#c9b48a" strokeWidth={0.9} opacity={0.6} />
      {/* left loop */}
      <path d="M45 32 C31 8 4 6 2 22 C0 38 24 40 45 32 Z" fill="#f5eddc" stroke="#5b83ab" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M45 32 C34 16 14 12 8 22" fill="none" stroke="#c9b48a" strokeWidth={1} opacity={0.65} />
      {/* right loop */}
      <path d="M45 32 C59 8 86 6 88 22 C90 38 66 40 45 32 Z" fill="#f5eddc" stroke="#5b83ab" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M45 32 C56 16 76 12 82 22" fill="none" stroke="#c9b48a" strokeWidth={1} opacity={0.65} />
      {/* knot */}
      <path d="M38 27 C38 21 52 21 52 27 C52 33 38 33 38 27 Z" fill="#5b83ab" />
      <circle cx="45" cy="27" r="3.2" fill="#fdfaf3" />
      <circle cx="45" cy="27" r="1.3" fill="#d88a95" />
    </svg>
  );
}

/** Ribbon-tag banner with notched ends, wrapping a short caption — the
 *  "ЭЛЕКТРОННОЕ ПРИГЛАШЕНИЕ" pennant motif from the reference design. */
export function SbBanner({ children }: { children: React.ReactNode }) {
  return (
    <span className="sb-banner">
      <span className="sb-banner-fold left" aria-hidden="true" />
      {children}
      <span className="sb-banner-fold right" aria-hidden="true" />
    </span>
  );
}

/** Three-pearl scatter — a small ornamental corner accent. */
export function SbPearlScatter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className ?? "sb-pearl-scatter"} aria-hidden="true">
      <circle cx="10" cy="20" r="4.5" fill="#fdfaf3" stroke="#c9b48a" strokeWidth={0.8} />
      <circle cx="24" cy="10" r="6" fill="#fdfaf3" stroke="#c9b48a" strokeWidth={0.8} />
      <circle cx="40" cy="18" r="3.5" fill="#fdfaf3" stroke="#c9b48a" strokeWidth={0.8} />
      <circle cx="50" cy="8" r="2.6" fill="#fdfaf3" stroke="#c9b48a" strokeWidth={0.8} />
    </svg>
  );
}

/** Layered wavy divider line — two stacked "ocean" swells under headings. */
function SbWave() {
  return (
    <svg viewBox="0 0 120 20" className="sb-wave" aria-hidden="true">
      <path
        d="M4 14 Q14 8 24 14 T44 14 T64 14 T84 14 T104 14 T116 14"
        fill="none"
        stroke="#7fa3cf"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <path
        d="M14 6 Q24 1 34 6 T54 6 T74 6 T94 6 T110 6"
        fill="none"
        stroke="#c9b48a"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}

/** Dashed divider with shells either side of a ribbon-banner caption — opens
 *  every non-cover section. */
export function SbDivider({ label }: { label: string }) {
  return (
    <div className="sb-divider">
      <span className="line" />
      <SbShell size={18} />
      <SbBanner>{label}</SbBanner>
      <SbShell size={18} />
      <span className="line" />
    </div>
  );
}

/** Script heading + banner caption + a layered wave rule, shared by every section. */
function SbHead({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="sb-head">
      {caption && <SbBanner>{caption}</SbBanner>}
      <h3>{title}</h3>
      <SbWave />
    </div>
  );
}

/** The gate's top flourish — shell · ornate bow · shell — rendered over the
 *  shared opening card via `ThemeModule.gateDecoration` (see InviteGate.tsx).
 *  The bottom-corner pearl/shell scatter lives in CSS (`.inv-gate::after` in
 *  theme.css.ts) since this slot only spans the top of the card, not its
 *  full height. */
export function SbGateDecoration() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%", maxWidth: 340, padding: "1.4rem 1.6rem 0", opacity: 0.9 }}>
      <div style={{ width: 30, opacity: 0.6, marginTop: "0.8rem" }}><SbShell size={30} /></div>
      <SbBow size={72} />
      <div style={{ width: 30, opacity: 0.6, marginTop: "0.8rem" }}><SbShell size={30} /></div>
    </div>
  );
}

// ── Cover ──────────────────────────────────────────────────────────────────────

interface SbCoverContent {
  heading?: string;
  subheading?: string;
  bigWord?: string;
  guestLabel?: string;
  imageUrl?: string;
}

export function SbCover({
  content,
  eventTitle,
  eventDate,
  venueName,
  guestName,
}: {
  content: SbCoverContent;
  eventTitle: string;
  eventDate: string;
  venueName?: string | null;
  guestName?: string | null;
  theme: ThemeTokens;
  assets?: Record<string, string>;
}) {
  const formatted = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="sb-cover">
      {content.subheading && <SbBanner>{content.subheading}</SbBanner>}
      <h1 className="sb-big">{content.bigWord || eventTitle}</h1>
      {content.imageUrl ? (
        <div className="sb-polaroid-wrap">
          <div className="sb-polaroid"><img src={content.imageUrl} alt="" /></div>
        </div>
      ) : (
        <SbBow size={80} className="sb-bow sb-cover-bow" />
      )}
      <SbWave />
      <div className="sb-guestpill"><SbShell size={14} /> {content.guestLabel || "Dear Guest"}</div>
      <div className={`sb-guestbox${guestName ? " has-name" : ""}`}>
        {guestName || `[ ${content.guestLabel || "Dear Guest"} ]`}
      </div>
      <h2 className="sb-names">{content.heading || eventTitle}</h2>
      <p className="sb-small sb-date">
        {formatted}
        {venueName ? ` · ${venueName}` : ""}
      </p>
      <div className="sb-cover-scatter"><SbPearlScatter /></div>
    </div>
  );
}

// ── Wording → welcome letter ───────────────────────────────────────────────────

export function SbWording({
  content,
}: {
  content: { title?: string; text?: string; imageUrl?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  const paragraphs = (content.text ?? "").split(/\n+/).filter(Boolean);
  if (!content.imageUrl && !content.title && paragraphs.length === 0) return null;
  return (
    <div>
      <SbDivider label="Dear Friends & Family" />
      {content.imageUrl && (
        <div className="sb-polaroid-wrap sb-small-polaroid">
          <div className="sb-polaroid"><img src={content.imageUrl} alt="" /></div>
        </div>
      )}
      {!content.hideTitle && content.title && <h2 className="sb-names">{content.title}</h2>}
      {paragraphs.map((p, i) => (
        <p key={i} className="sb-body">{p}</p>
      ))}
    </div>
  );
}

// ── Countdown → hearted month calendar + digital counter ─────────────────────

export function SbCountdown({
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
      {!hideTitle && <SbHead title={label || "Save the Date"} caption="Until We Meet" />}
      <div className="sb-cal">
        <div className="sb-cal-month">
          <span>{monthName}</span>
          <span>·</span>
          <b>{year}</b>
        </div>
        <div className="sb-cal-grid">
          {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
            <span key={`h${i}`} className="sb-cal-dow">{l}</span>
          ))}
          {cells.map((n, i) =>
            n === null ? (
              <span key={i} />
            ) : (
              <span key={i} className={`sb-cal-day${n === day ? " on" : ""}`}>{n}</span>
            )
          )}
        </div>
      </div>
      {!time.expired ? (
        <div className="sb-digits">
          {[
            { v: time.days, l: "Days" },
            { v: time.hours, l: "Hrs" },
            { v: time.minutes, l: "Min" },
            { v: time.seconds, l: "Sec" },
          ].map((u) => (
            <div key={u.l} className="sb-digit">
              <span className="n">{String(u.v).padStart(2, "0")}</span>
              <span className="l">{u.l}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="sb-cal-count">The day has arrived! ✧</p>
      )}
    </div>
  );
}

// ── Agenda → ruled timing schedule ─────────────────────────────────────────────

interface SbAgendaItem { time?: string; title?: string }

export function SbAgenda({
  content,
}: {
  content: { title?: string; items?: SbAgendaItem[]; hideTitle?: boolean; note?: string };
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  if (items.length === 0) return null;
  return (
    <div>
      {!content.hideTitle && <SbHead title={content.title || "Timing"} caption="Order of the Day" />}
      <div className="sb-agenda">
        {items.map((item, i) => (
          <div key={i} className="sb-agenda-row">
            <span className="sb-agenda-time">{item.time}</span>
            <span className="sb-agenda-dot" />
            <span className="sb-agenda-activity">{item.title}</span>
          </div>
        ))}
      </div>
      {content.note && <div className="sb-note">✧ {content.note}</div>}
    </div>
  );
}

// ── Details → venue, dress code pearls, celebration notes ─────────────────────

interface SbDetailItem { label?: string; value?: string }

export function SbDetails({
  content,
  venueName,
  venueMapUrl,
}: {
  content: {
    title?: string;
    hideTitle?: boolean;
    items?: SbDetailItem[];
    imageUrl?: string;
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
  const mapUrl = content.mapUrl || venueMapUrl;
  const notes = (content.notes ?? []).filter((n) => n.trim());
  const hasDresscode = !!(content.dresscode && content.dresscode.length > 0);
  if (!venueName && items.length === 0 && !mapUrl && !content.imageUrl && !hasDresscode && notes.length === 0) return null;

  return (
    <div>
      {!content.hideTitle && <SbHead title={content.title || "Venue"} caption="Where We'll Gather" />}
      {content.imageUrl && (
        <div className="sb-venue-photo"><img src={content.imageUrl} alt="" /></div>
      )}
      {venueName && <p className="sb-detail-value">{venueName}</p>}
      {items.map((item, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          {item.label && <p className="sb-detail-label">{item.label}</p>}
          <p className="sb-body" style={{ margin: "0 0 0.2rem" }}>{item.value}</p>
        </div>
      ))}
      {mapUrl && (
        <p style={{ textAlign: "center" }}>
          <a className="sb-btn" href={mapUrl} target="_blank" rel="noreferrer">{content.mapLabel || "Build Route"}</a>
        </p>
      )}

      {hasDresscode && (
        <div className="sb-dress-block">
          <p className="sb-detail-label">{content.dresscodeLabel || "Dress Code"}</p>
          {content.dresscodeText && <p className="sb-body">{content.dresscodeText}</p>}
          <div className="sb-pearls">
            <SbShell size={20} />
            {content.dresscode!.map((c, i) => (
              <span key={i} className="sb-pearl" style={{ background: c }} />
            ))}
            <SbShell size={20} />
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="sb-notes">
          <p className="sb-detail-label">{content.notesLabel || "Celebration Details"}</p>
          {notes.map((n, i) => (
            <div key={i} className="sb-note-card">
              <span className="num">{i + 1}</span>
              <p>{n}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gallery → scattered polaroids ─────────────────────────────────────────────

interface SbPhoto { id: string; url: string; sortOrder: number }

export function SbGallery({
  content,
  photos,
}: {
  content: { title?: string; hideTitle?: boolean };
  photos: SbPhoto[];
  theme: ThemeTokens;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (photos.length === 0) return null;

  return (
    <div>
      {!content.hideTitle && <SbHead title={content.title || "Our Moments"} caption="Gallery" />}
      <div className="sb-polaroids">
        {photos.map((p) => (
          <div key={p.id} className="sb-polaroid sb-gallery-polaroid" onClick={() => setLightbox(p.url)}>
            <img src={p.url} alt="" />
          </div>
        ))}
      </div>
      {lightbox && <PhotoLightbox url={lightbox} onClose={() => setLightbox(null)} overlayColor="rgba(20, 32, 48, 0.88)" />}
    </div>
  );
}

// ── KHQR ───────────────────────────────────────────────────────────────────────

export function SbKhqr({
  content,
}: {
  content: { title?: string; recipientName?: string; qrImageUrl?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  if (!content.qrImageUrl) return null;
  return (
    <div>
      {!content.hideTitle && <SbHead title={content.title || "A Gift From the Heart"} caption="Should You Wish" />}
      <p className="sb-body">Instead of flowers, you may send a little love here:</p>
      <img className="sb-qr" src={content.qrImageUrl} alt="KHQR" />
      {content.recipientName && <p className="sb-body" style={{ marginTop: "0.6rem" }}>{content.recipientName}</p>}
    </div>
  );
}

// ── Wishing wall ───────────────────────────────────────────────────────────────

export function SbWishing({
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
      {!content.hideTitle && <SbHead title={content.title || "Leave Us a Wish"} caption="Sign Our Guestbook" />}
      <form onSubmit={handleSubmit} className="inv-wish-form">
        <input className="sb-wish-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        <input className="sb-wish-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={content.placeholder || "Your wishes…"} required />
        {error && <p style={{ margin: 0, color: "#c0392b", fontSize: "0.9rem", textAlign: "center" }}>{error}</p>}
        {submitted && <p style={{ margin: 0, color: "#5b83ab", fontSize: "0.9rem", textAlign: "center" }}>Sent with love ✧</p>}
        <button className="sb-wish-send" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send with love ✧"}</button>
      </form>
      {wishes.length > 0 && (
        <div style={{ marginTop: "1.1rem" }}>
          {wishes.slice(0, 6).map((w) => (
            <div key={w.id} className="sb-wish-card">
              <p className="sb-wish-msg">&ldquo;{w.message}&rdquo;</p>
              <p className="sb-wish-from">— {w.guestName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

