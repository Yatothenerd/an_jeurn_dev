"use client";

// Royal Ticket bespoke section renderers — a navy boarding-pass / passport
// travel theme: white ticket-stub cards with a perforated notch line, a
// plane + globe glyph, gold passport-stamp ornaments, and two-column ticket
// data rows. Every renderer is DB-driven: it receives the Section.content
// JSON plus event/photo/wish data the invite page loads from Prisma, so the
// design updates whenever the stored data changes.

import { useState } from "react";
import type { InviteWish } from "@/lib/utils/invite-cache";
import type { ThemeTokens } from "../../types";
import { useCountdown } from "../../shared/use-countdown";
import { useWishForm } from "../../shared/use-wish-form";
import { PhotoLightbox } from "../../shared/PhotoLightbox";
import { getMonthCalendar } from "../../shared/month-calendar";

// ── Decorative line art ───────────────────────────────────────────────────────

export function RtPlane({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M2 16 L22 9 L19 12 L22 15 L14 13.5 L9 20 L7.5 19.5 L10 13 L2 16 Z"
        fill="none" stroke="#c8a15c" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}

function RtGlobe({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="none" stroke="#12213f" strokeWidth={1.3} />
      <ellipse cx="20" cy="20" rx="7" ry="17" fill="none" stroke="#12213f" strokeWidth={1.1} />
      <line x1="3" y1="20" x2="37" y2="20" stroke="#12213f" strokeWidth={1.1} />
      <path d="M5 12 H35 M5 28 H35" fill="none" stroke="#12213f" strokeWidth={1} />
    </svg>
  );
}

/** Dashed passport-stamp ring — purely decorative flourish. */
function RtStamp({ size = 54 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true">
      <circle cx="30" cy="30" r="26" fill="none" stroke="#c8a15c" strokeWidth={1.2} strokeDasharray="3 3" />
      <circle cx="30" cy="30" r="20" fill="none" stroke="#c8a15c" strokeWidth={1} />
      <RtPlaneMark />
    </svg>
  );
}
function RtPlaneMark() {
  return <g transform="translate(18 20) scale(0.9)"><RtPlane size={24} /></g>;
}

/** Ticket stub label banner — plane glyph either side of a small caps caption. */
export function RtDivider({ label }: { label: string }) {
  return (
    <div className="rt-divider">
      <RtPlane size={14} />
      <span className="tag">{label}</span>
      <RtPlane size={14} className="rt-plane-flip" />
    </div>
  );
}

/** Serif heading + gold rule, shared by every ticket card body. */
function RtHead({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="rt-head">
      {caption && <p className="cap">{caption}</p>}
      <h3>{title}</h3>
      <div className="rule" />
    </div>
  );
}

/** The gate's top flourish — stamp · plane · stamp — rendered over the shared
 *  opening card via `ThemeModule.gateDecoration` (see InviteGate.tsx). */
export function RtGateDecoration() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 340, padding: "1.4rem 1.6rem 0", opacity: 0.9 }}>
      <div style={{ width: 34, opacity: 0.7 }}><RtStamp size={34} /></div>
      <RtPlane size={22} />
      <div style={{ width: 34, opacity: 0.7 }}><RtStamp size={34} /></div>
    </div>
  );
}

/** Ticket-data row: a small caps label above a value, used on the cover stub. */
function RtDataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rt-data-row">
      <span className="l">{label}</span>
      <span className="v">{value}</span>
    </div>
  );
}

/** Photo wrapper: color by default, opt-in black & white via `content.grayscale`. */
function RtPhoto({ url, grayscale }: { url: string; grayscale?: boolean }) {
  return (
    <div className={`rt-photo${grayscale ? " rt-photo-mono" : ""}`}>
      <img src={url} alt="" />
    </div>
  );
}

// ── Cover → boarding pass ──────────────────────────────────────────────────────

interface RtCoverContent {
  heading?: string;
  subheading?: string;
  bigWord?: string;
  guestLabel?: string;
  imageUrl?: string;
}

export function RtCover({
  content,
  eventTitle,
  eventDate,
  guestName,
}: {
  content: RtCoverContent;
  eventTitle: string;
  eventDate: string;
  venueName?: string | null;
  guestName?: string | null;
  theme: ThemeTokens;
  assets?: Record<string, string>;
}) {
  const formatted = new Date(eventDate).toLocaleDateString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <div className="rt-cover">
      <p className="rt-stub-label">Wedding Ticket</p>
      <RtGlobe />
      <h1 className="rt-big">{content.heading || eventTitle}</h1>
      <div className="rt-data-grid">
        <RtDataRow label="Flight Date" value={formatted} />
        <RtDataRow label="Class" value="First Class" />
      </div>
      <RtDataRow label="Destination" value={content.subheading || content.bigWord || "A ticket to happiness"} />
      <div className="rt-guestbox">
        <span className="l">{content.guestLabel || "Passenger"}</span>
        <span className="v">{guestName || "Honoured Guest"}</span>
      </div>
      <p className="rt-stub-label">Wedding Ticket</p>
    </div>
  );
}

// ── Wording → welcome letter with an optional photo ───────────────────────────

export function RtWording({
  content,
}: {
  content: { title?: string; text?: string; imageUrl?: string; hideTitle?: boolean; grayscale?: boolean };
  theme: ThemeTokens;
}) {
  const paragraphs = (content.text ?? "").split(/\n+/).filter(Boolean);
  if (!content.imageUrl && !content.title && paragraphs.length === 0) return null;
  return (
    <div>
      {!content.hideTitle && <RtDivider label="Dear Friends & Family" />}
      {content.imageUrl && <RtPhoto url={content.imageUrl} grayscale={content.grayscale} />}
      {!content.hideTitle && content.title && <h2 className="rt-names">{content.title}</h2>}
      {paragraphs.map((p, i) => (
        <p key={i} className="rt-body">{p}</p>
      ))}
    </div>
  );
}

// ── Countdown → calendar + digital counter ────────────────────────────────────

export function RtCountdown({
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
      {!hideTitle && <RtDivider label={label || "Save the Date"} />}
      <div className="rt-cal">
        <div className="rt-cal-month"><span>{monthName}</span><b>{year}</b></div>
        <div className="rt-cal-grid">
          {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
            <span key={`h${i}`} className="rt-cal-dow">{l}</span>
          ))}
          {cells.map((n, i) =>
            n === null ? (
              <span key={i} />
            ) : (
              <span key={i} className={`rt-cal-day${n === day ? " on" : ""}`}>{n}</span>
            )
          )}
        </div>
      </div>
      {!time.expired ? (
        <div className="rt-digits">
          {[
            { v: time.days, l: "Days" },
            { v: time.hours, l: "Hrs" },
            { v: time.minutes, l: "Min" },
            { v: time.seconds, l: "Sec" },
          ].map((u) => (
            <div key={u.l} className="rt-digit">
              <span className="n">{String(u.v).padStart(2, "0")}</span>
              <span className="l">{u.l}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rt-cal-count">The big day has arrived!</p>
      )}
    </div>
  );
}

// ── Agenda → ruled schedule ────────────────────────────────────────────────────

interface RtAgendaItem { time?: string; title?: string }

export function RtAgenda({
  content,
}: {
  content: { title?: string; items?: RtAgendaItem[]; hideTitle?: boolean; note?: string };
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  if (items.length === 0) return null;
  return (
    <div>
      {!content.hideTitle && <RtHead title={content.title || "Day's Program"} caption="Itinerary" />}
      <div className="rt-agenda">
        {items.map((item, i) => (
          <div key={i} className="rt-agenda-row">
            <span className="rt-agenda-time">{item.time}</span>
            <span className="rt-agenda-activity">{item.title}</span>
          </div>
        ))}
      </div>
      {content.note && <div className="rt-note">✈ {content.note}</div>}
    </div>
  );
}

// ── Details → venue, dress-code tags, celebration notes ───────────────────────

interface RtDetailItem { label?: string; value?: string }

export function RtDetails({
  content,
  venueName,
  venueMapUrl,
}: {
  content: {
    title?: string;
    hideTitle?: boolean;
    items?: RtDetailItem[];
    imageUrl?: string;
    grayscale?: boolean;
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
      {!content.hideTitle && <RtHead title={content.title || "Venue"} caption="Destination" />}
      {content.imageUrl && <RtPhoto url={content.imageUrl} grayscale={content.grayscale} />}
      {venueName && <p className="rt-detail-value">{venueName}</p>}
      {items.map((item, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          {item.label && <p className="rt-detail-label">{item.label}</p>}
          <p className="rt-body" style={{ margin: "0 0 0.2rem" }}>{item.value}</p>
        </div>
      ))}
      {mapUrl && (
        <p style={{ textAlign: "center" }}>
          <a className="rt-btn" href={mapUrl} target="_blank" rel="noreferrer">{content.mapLabel || "View Map"}</a>
        </p>
      )}

      {hasDresscode && (
        <div className="rt-dress-block">
          <p className="rt-detail-label">{content.dresscodeLabel || "Dress Code"}</p>
          {content.dresscodeText && <p className="rt-body">{content.dresscodeText}</p>}
          <div className="rt-tags">
            {content.dresscode!.map((c, i) => (
              <span key={i} className="rt-tag-chip" style={{ background: c }} />
            ))}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="rt-notes">
          <p className="rt-detail-label">{content.notesLabel || "Notes"}</p>
          {notes.map((n, i) => (
            <p key={i} className="rt-body">{n}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gallery → photo grid (color by default) ────────────────────────────────────

interface RtPhotoRow { id: string; url: string; sortOrder: number }

export function RtGallery({
  content,
  photos,
}: {
  content: { title?: string; hideTitle?: boolean; grayscale?: boolean };
  photos: RtPhotoRow[];
  theme: ThemeTokens;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (photos.length === 0) return null;

  return (
    <div>
      {!content.hideTitle && <RtHead title={content.title || "Gallery"} caption="Our Moments" />}
      <div className="rt-gallery">
        {photos.map((p) => (
          <div key={p.id} className={`rt-gallery-photo${content.grayscale ? " rt-gallery-mono" : ""}`} onClick={() => setLightbox(p.url)}>
            <img src={p.url} alt="" />
          </div>
        ))}
      </div>
      {lightbox && <PhotoLightbox url={lightbox} onClose={() => setLightbox(null)} overlayColor="rgba(6, 12, 26, 0.92)" />}
    </div>
  );
}

// ── KHQR ───────────────────────────────────────────────────────────────────────

export function RtKhqr({
  content,
}: {
  content: { title?: string; recipientName?: string; qrImageUrl?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  if (!content.qrImageUrl) return null;
  return (
    <div>
      {!content.hideTitle && <RtHead title={content.title || "Wedding Gift"} caption="With Love" />}
      <p className="rt-body">Instead of flowers, you may send a little something here:</p>
      <img className="rt-qr" src={content.qrImageUrl} alt="KHQR" />
      {content.recipientName && <p className="rt-body" style={{ marginTop: "0.6rem" }}>{content.recipientName}</p>}
    </div>
  );
}

// ── Wishing wall → "Song Requests" ticket stub ────────────────────────────────

export function RtWishing({
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
      {!content.hideTitle && <RtHead title={content.title || "Song Requests"} caption="Don't Miss These" />}
      <form onSubmit={handleSubmit} className="inv-wish-form">
        <input className="rt-wish-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        <input className="rt-wish-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={content.placeholder || "Song title…"} required />
        {error && <p style={{ margin: 0, color: "#c0392b", fontSize: "0.9rem", textAlign: "center" }}>{error}</p>}
        {submitted && <p style={{ margin: 0, color: "#12213f", fontSize: "0.9rem", textAlign: "center" }}>Sent!</p>}
        <button className="rt-wish-send" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send"}</button>
      </form>
      {wishes.length > 0 && (
        <div style={{ marginTop: "1.1rem" }}>
          {wishes.slice(0, 6).map((w) => (
            <div key={w.id} className="rt-wish-card">
              <p className="rt-wish-msg">&ldquo;{w.message}&rdquo;</p>
              <p className="rt-wish-from">— {w.guestName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

