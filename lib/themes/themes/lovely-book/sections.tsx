"use client";

// Lovely Book bespoke section renderers. Every renderer is DB-driven: it
// receives the Section.content JSON plus event/photo/wish data the invite page
// loads from Prisma, so the design updates whenever the stored data changes.
// Modeled directly on the Sweet Hearts theme's structure (see ../sweet-hearts).

import { useState } from "react";
import type { InviteWish } from "@/lib/utils/invite-cache";
import type { ThemeTokens } from "../../types";
import { useCountdown } from "../../shared/use-countdown";
import { useWishForm } from "../../shared/use-wish-form";

// ── Decorative line art ───────────────────────────────────────────────────────

export function LbBow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 44" className={className ?? "lb-bow"} aria-hidden="true">
      <path d="M30 20 C22 8 6 6 4 16 C2 26 18 26 30 20 Z" fill="#f6d6de" stroke="#7c1f34" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M30 20 C38 8 54 6 56 16 C58 26 42 26 30 20 Z" fill="#f6d6de" stroke="#7c1f34" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx="30" cy="20" r="4.5" fill="#7c1f34" />
      <path d="M27 23 L22 34 M33 23 L38 34" stroke="#7c1f34" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function LbCake() {
  return (
    <svg viewBox="0 0 44 40" className="lb-cake" aria-hidden="true">
      <path d="M22 2 L22 9" stroke="#7c1f34" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M19 2 C19 0 25 0 25 2 C25 4 19 4 19 2 Z" fill="#f6d6de" stroke="#7c1f34" strokeWidth={1.2} />
      <rect x="6" y="20" width="32" height="16" rx="2" fill="#fdf0f2" stroke="#7c1f34" strokeWidth={1.4} />
      <path d="M6 20 C6 14 38 14 38 20" fill="#fdf0f2" stroke="#7c1f34" strokeWidth={1.4} />
      <path d="M6 28 L38 28" stroke="#7c1f34" strokeWidth={1} strokeDasharray="2 3" />
      <path d="M13 20 V13 M22 20 V13 M31 20 V13" stroke="#7c1f34" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

function LbCherub({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 60 60" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <circle cx="30" cy="18" r="8" fill="none" stroke="#c98a9a" strokeWidth={1.3} />
      <path d="M22 30 C18 34 18 44 24 48 C28 51 32 51 36 48 C42 44 42 34 38 30" fill="none" stroke="#c98a9a" strokeWidth={1.3} />
      <path d="M22 30 C8 26 4 14 12 10 C18 7 22 16 22 26" fill="none" stroke="#c98a9a" strokeWidth={1.1} />
      <path d="M38 30 C52 26 56 14 48 10 C42 7 38 16 38 26" fill="none" stroke="#c98a9a" strokeWidth={1.1} />
    </svg>
  );
}

/** The gate's top flourish — cherub · bow · cherub — rendered over the shared
 *  opening card via `ThemeModule.gateDecoration` (see InviteGate.tsx). Purely
 *  decorative and pointer-events:none (the wrapping slot already sets that). */
export function LbGateDecoration() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%", maxWidth: 340, padding: "1.4rem 1.6rem 0", opacity: 0.9 }}>
      <div style={{ width: 44, opacity: 0.55, marginTop: "0.6rem" }}><LbCherub /></div>
      <LbBow className="lb-bow" />
      <div style={{ width: 44, opacity: 0.55, marginTop: "0.6rem" }}><LbCherub flip /></div>
    </div>
  );
}

/** Dashed divider with a "♥ label ♥" caption — opens every non-cover section. */
export function LbDivider({ label }: { label: string }) {
  return (
    <div className="lb-divider">
      <span className="line" />
      <span className="tag">♥ {label} ♥</span>
      <span className="line" />
    </div>
  );
}

/** Bold Khmer heading + italic caption + a short rule, shared by every section. */
function LbHead({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="lb-head">
      <h3>{title}</h3>
      {caption && <p className="cap">{caption}</p>}
      <div className="rule" />
    </div>
  );
}

// ── Cover ──────────────────────────────────────────────────────────────────────

interface LbCoverContent {
  heading?: string;
  subheading?: string;
  bigWord?: string;
  guestLabel?: string;
}

export function LbCover({
  content,
  eventTitle,
  eventDate,
  venueName,
  guestName,
}: {
  content: LbCoverContent;
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
    <div className="lb-cover">
      <div className="lb-cherubs">
        <LbCherub />
        <LbCherub flip />
      </div>
      <LbBow />
      <p className="lb-eyebrow">{content.subheading || "With love"}</p>
      <h1 className="lb-big">{content.bigWord || eventTitle}</h1>
      <LbCake />
      <div className="lb-guestpill">✨ {content.guestLabel || "Respected Guest"}</div>
      <div className={`lb-guestbox${guestName ? " has-name" : ""}`}>
        {guestName || `[ ${content.guestLabel || "Respected Guest"} ]`}
      </div>
      <h2 className="lb-names" style={{ fontSize: "1.3rem" }}>{content.heading || eventTitle}</h2>
      <p className="lb-small lb-date">
        {formatted}
        {venueName ? ` · ${venueName}` : ""}
      </p>
    </div>
  );
}

// ── Wording → oval photo + names + greeting ───────────────────────────────────

export function LbWording({
  content,
}: {
  content: { title?: string; text?: string; imageUrl?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  const paragraphs = (content.text ?? "").split(/\n+/).filter(Boolean);
  return (
    <div>
      <LbDivider label="Our Special Day" />
      {content.imageUrl && (
        <div className="lb-oval-wrap">
          <div className="lb-oval"><img src={content.imageUrl} alt="" /></div>
        </div>
      )}
      {!content.hideTitle && content.title && <h2 className="lb-names">{content.title}</h2>}
      {paragraphs.map((p, i) => (
        <p key={i} className="lb-body">{p}</p>
      ))}
    </div>
  );
}

// ── Countdown → Saturday-first week strip, target day hearted ────────────────

export function LbCountdown({
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
  const target = new Date(targetDate || eventDate);
  const dow = target.getDay(); // 0=Sun..6=Sat
  const diffToSat = (dow + 1) % 7;
  const sat = new Date(target);
  sat.setDate(target.getDate() - diffToSat);
  const dayLabels = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sat);
    d.setDate(sat.getDate() + i);
    return d;
  });

  return (
    <div>
      {!hideTitle && <LbHead title={label || "កាលបរិច្ឆេទ"} caption="Save the Date" />}
      <div className="lb-week">
        {days.map((d, i) => (
          <div key={i} className={`lb-week-day${d.toDateString() === target.toDateString() ? " on" : ""}`}>
            <span className="lb-week-lbl">{dayLabels[i]}</span>
            <span className="lb-week-num">{d.getDate()}</span>
          </div>
        ))}
      </div>
      <p className="lb-cd-count">
        {time.expired ? "The day has arrived! ♥" : `${time.days} days · ${time.hours} hrs · ${time.minutes} min to go`}
      </p>
    </div>
  );
}

// ── Agenda → ruled time / activity table ──────────────────────────────────────

interface LbAgendaItem { time?: string; title?: string; titleEn?: string }

export function LbAgenda({
  content,
}: {
  content: { title?: string; items?: LbAgendaItem[]; hideTitle?: boolean; note?: string };
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  if (items.length === 0) return null;
  return (
    <div>
      {!content.hideTitle && <LbHead title={content.title || "កម្មវិធីប្រចាំថ្ងៃ"} caption="Program of the Day" />}
      <div className="lb-agenda-head">
        <span>Start time</span>
        <span>Activity</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="lb-agenda-row">
          <span className="lb-agenda-time">{item.time}</span>
          <span className="lb-agenda-activity">
            {item.title}
            {item.titleEn && <small>{item.titleEn}</small>}
          </span>
        </div>
      ))}
      {content.note && <div className="lb-note">* {content.note}</div>}
    </div>
  );
}

// ── Details → venue / location ────────────────────────────────────────────────

function LbPavilion() {
  return (
    <svg viewBox="0 0 80 56" className="lb-venue-icon" aria-hidden="true">
      <path d="M40 2 L46 8 L34 8 Z" fill="#f6d6de" stroke="#c98a9a" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M40 2 V8" stroke="#c98a9a" strokeWidth={1.2} />
      <path d="M18 20 L40 8 L62 20" fill="none" stroke="#c98a9a" strokeWidth={1.3} strokeLinejoin="round" />
      <rect x="22" y="20" width="36" height="24" rx="1.5" fill="none" stroke="#c98a9a" strokeWidth={1.3} />
      <rect x="35" y="30" width="10" height="14" fill="none" stroke="#c98a9a" strokeWidth={1.1} />
      <path d="M8 44 H72" stroke="#c98a9a" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M2 50 C10 46 18 46 26 50 C34 54 42 54 50 50 C58 46 66 46 74 50" fill="none" stroke="#e8c9d1" strokeWidth={1.3} />
    </svg>
  );
}

interface LbDetailItem { label?: string; value?: string }

export function LbDetails({
  content,
  venueName,
  venueMapUrl,
}: {
  content: { title?: string; hideTitle?: boolean; items?: LbDetailItem[]; mapUrl?: string; mapLabel?: string; imageUrl?: string };
  venueName: string | null;
  venueMapUrl: string | null;
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  const mapUrl = content.mapUrl || venueMapUrl;
  if (!venueName && items.length === 0 && !mapUrl && !content.imageUrl) return null;

  return (
    <div>
      {!content.hideTitle && <LbHead title={content.title || "ទីតាំងកម្មវិធី"} caption="Map Venue" />}
      {content.imageUrl && (
        <div className="lb-venue-photo"><img src={content.imageUrl} alt="" /></div>
      )}
      <p className="lb-detail-label" style={{ marginTop: content.imageUrl ? "1rem" : 0 }}>Celebration Landmark Location</p>
      {venueName && <p className="lb-detail-value">📍 {venueName}</p>}
      {items.map((item, i) => (
        <div key={i}>
          {item.label && <p className="lb-detail-label">{item.label}</p>}
          <p className="lb-body" style={{ margin: "0 0 0.2rem" }}>{item.value}</p>
        </div>
      ))}
      {mapUrl && (
        <p style={{ textAlign: "center" }}>
          <a className="lb-btn" href={mapUrl} target="_blank" rel="noreferrer">{content.mapLabel || "Get Map"}</a>
        </p>
      )}
      <LbPavilion />
    </div>
  );
}

// ── Gallery → scattered polaroids ─────────────────────────────────────────────

interface LbPhoto { id: string; url: string; sortOrder: number }

export function LbGallery({
  content,
  photos,
}: {
  content: { title?: string; hideTitle?: boolean };
  photos: LbPhoto[];
  theme: ThemeTokens;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (photos.length === 0) return null;

  return (
    <div>
      {!content.hideTitle && <LbHead title={content.title || "កម្រងរូបភាព"} caption="Polaroid Gallery" />}
      <div className="lb-polaroids">
        {photos.map((p) => (
          <div key={p.id} className="lb-polaroid" onClick={() => setLightbox(p.url)}>
            <img src={p.url} alt="" />
          </div>
        ))}
      </div>
      {lightbox && (
        <div style={lightboxBg} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" style={lightboxImg} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ── KHQR ───────────────────────────────────────────────────────────────────────

export function LbKhqr({
  content,
}: {
  content: { title?: string; recipientName?: string; qrImageUrl?: string; hideTitle?: boolean };
  theme: ThemeTokens;
}) {
  if (!content.qrImageUrl) return null;
  return (
    <div>
      {!content.hideTitle && <LbHead title={content.title || "អំណោយចិត្ត"} caption="A Gift From the Heart" />}
      <p className="lb-body">Instead of flowers, you may send a little love here:</p>
      <img className="lb-qr" src={content.qrImageUrl} alt="KHQR" />
      {content.recipientName && <p className="lb-body" style={{ marginTop: "0.6rem" }}>{content.recipientName}</p>}
    </div>
  );
}

// ── Wishing wall ───────────────────────────────────────────────────────────────

export function LbWishing({
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
      {!content.hideTitle && <LbHead title={content.title || "សារជូនពរ"} caption="Wishes & Blessings" />}
      <form onSubmit={handleSubmit} className="inv-wish-form">
        <input className="lb-wish-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        <input className="lb-wish-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={content.placeholder || "Your wishes…"} required />
        {error && <p style={{ margin: 0, color: "#c0392b", fontSize: "0.9rem", textAlign: "center" }}>{error}</p>}
        {submitted && <p style={{ margin: 0, color: "#7c1f34", fontSize: "0.9rem", textAlign: "center" }}>Sent with love ♥</p>}
        <button className="lb-wish-send" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send with love ♥"}</button>
      </form>
      {wishes.length > 0 && (
        <div style={{ marginTop: "1.1rem" }}>
          {wishes.slice(0, 6).map((w) => (
            <div key={w.id} className="lb-wish-card">
              <p className="lb-wish-msg">&ldquo;{w.message}&rdquo;</p>
              <p className="lb-wish-from">— {w.guestName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const lightboxBg: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(40, 10, 20, 0.88)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", cursor: "zoom-out",
};
const lightboxImg: React.CSSProperties = {
  maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px", cursor: "default",
};
