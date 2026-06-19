"use client";

// Royal Khmer bespoke section renderers. Each matches the prop shape the invite
// page passes for its section type; the theme registers these in `sections` and
// inherits the standard renderer for anything it doesn't override.

import { useState } from "react";
import Image from "next/image";
import type { InviteWish } from "@/lib/utils/invite-cache";
import type { ThemeTokens } from "../../types";
import { useCountdown } from "../../shared/use-countdown";
import { useWishForm } from "../../shared/use-wish-form";

// ── Cover ──
interface CoverContent {
  heading?: string;
  subheading?: string;
  guestLabel?: string;
  inviteKh?: string;
  graceKh?: string;
}

export function KhmerCover({
  content,
  eventTitle,
  eventDate,
  venueName,
  guestName,
}: {
  content: CoverContent;
  eventTitle: string;
  eventDate: string;
  venueName?: string | null;
  guestName?: string | null;
  theme: ThemeTokens;
}) {
  const formatted = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const label = content.guestLabel || "Respected Guest";

  return (
    <div className="rk-cover">
      <div className="rk-frame f1" />
      <div className="rk-frame f2" />
      <img className="rk-monogram" src="/themes/khmer/monogram.png" alt="" />
      <div className="rk-cover-mid">
        <p className="rk-cover-kh">{content.inviteKh || "សូមគោរពអញ្ជើញ"}</p>
        <p className="rk-cover-en">{content.subheading || "We are honored to invite"}</p>
        <div className="rk-nameplate">
          <img src="/themes/khmer/name-placeholder.png" alt="" />
          <span className="rk-guest">{guestName || label}</span>
        </div>
        <div className="rk-cdiv" />
        <p className="rk-cover-kh">{content.graceKh || "ចូលរួមជាអធិបតីក្នុងពិធីមង្គលការ"}</p>
        <p className="rk-cover-en">{content.heading || eventTitle}</p>
      </div>
      <button className="rk-btn" style={{ maxWidth: 200 }}>
        {formatted}
        <small style={{ opacity: 0.8 }}>{venueName || ""}</small>
      </button>
    </div>
  );
}

// ── Countdown ──
export function KhmerCountdown({
  targetDate,
  label,
  eventDate,
  theme,
}: {
  targetDate: string;
  label?: string;
  eventDate: string;
  theme: ThemeTokens;
}) {
  const time = useCountdown(targetDate, eventDate);
  const units = [
    { value: time.days, label: "Days" },
    { value: time.hours, label: "Hours" },
    { value: time.minutes, label: "Mins" },
    { value: time.seconds, label: "Secs" },
  ];

  return (
    <>
      <h3 className="rk-title">{label || "រាប់ថយក្រោយ"}</h3>
      <p className="rk-sub">Counting Down</p>
      {time.expired ? (
        <p style={{ textAlign: "center", color: theme.primary, fontFamily: theme.font, fontSize: "1.5rem", fontWeight: 300 }}>
          The day has arrived!
        </p>
      ) : (
        <div className="inv-countdown">
          {units.map((u) => (
            <div key={u.label} className="inv-cd-unit" style={{ background: theme.cardBg, borderColor: theme.border }}>
              <span className="inv-cd-num" style={{ color: theme.primary }}>{String(u.value).padStart(2, "0")}</span>
              <span className="inv-cd-lbl" style={{ color: theme.accent }}>{u.label}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Agenda ──
interface AgendaItem {
  time?: string;
  timeEn?: string;
  title?: string;
  titleEn?: string;
  icon?: number | string;
}

export function KhmerAgenda({
  content,
}: {
  content: { title?: string; subtitle?: string; items?: AgendaItem[] };
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  return (
    <>
      <h3 className="rk-title">{content.title || "ពិធីមង្គលការ"}</h3>
      <p className="rk-sub">{content.subtitle || "Agenda"}</p>
      {items.map((item, i) => (
        <div key={i} className="rk-agenda-row">
          <div className="rk-agenda-ic">{item.icon && <img src={`/themes/agenda/${item.icon}.png`} alt="" />}</div>
          <div>
            {item.time && (
              <p className="rk-agenda-time">
                {item.time}
                {item.timeEn && <small>{item.timeEn}</small>}
              </p>
            )}
            <p className="rk-agenda-kh">{item.title}</p>
            {item.titleEn && <p className="rk-agenda-en">{item.titleEn}</p>}
          </div>
        </div>
      ))}
    </>
  );
}

// ── Details ──
interface DetailItem {
  icon: string;
  label: string;
  value: string;
}

export function KhmerDetails({
  content,
  venueName,
  venueMapUrl,
}: {
  content: { title?: string; items?: DetailItem[] };
  venueName: string | null;
  venueMapUrl: string | null;
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  return (
    <>
      <h3 className="rk-title">{content.title || "ព័ត៌មានលម្អិត"}</h3>
      <p className="rk-sub">Event Details</p>
      {items.map((item, i) => (
        <p key={i} className="rk-body">
          <strong>{item.label}:</strong> {item.value}
        </p>
      ))}
      {venueName && <p className="rk-body">{venueName}</p>}
      {venueMapUrl && (
        <div style={{ textAlign: "center" }}>
          <a className="rk-btn" href={venueMapUrl} target="_blank" rel="noreferrer">
            View on Map
          </a>
        </div>
      )}
    </>
  );
}

// ── Gallery ──
interface Photo {
  id: string;
  url: string;
  sortOrder: number;
}

export function KhmerGallery({
  content,
  photos,
}: {
  content: { layout?: string; title?: string };
  photos: Photo[];
  theme: ThemeTokens;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (photos.length === 0) return null;

  const [hero, ...rest] = photos;
  return (
    <>
      <h3 className="rk-title">{content.title || "រូបភាពអនុស្សាវរីយ៍"}</h3>
      <p className="rk-sub">Memories Gallery</p>
      <div className="rk-gal">
        <img src={hero.url} alt="" onClick={() => setLightbox(hero.url)} style={{ cursor: "zoom-in" }} />
        {rest.length > 0 && (
          <div className="two">
            {rest.slice(0, 2).map((p) => (
              <img key={p.id} src={p.url} alt="" onClick={() => setLightbox(p.url)} style={{ cursor: "zoom-in" }} />
            ))}
          </div>
        )}
      </div>
      {lightbox && (
        <div style={lightboxBg} onClick={() => setLightbox(null)}>
          <Image src={lightbox} alt="" width={800} height={600} style={lightboxImg} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

// ── Video ──
export function KhmerVideo({
  content,
}: {
  content: { url?: string; caption?: string; title?: string };
  theme: ThemeTokens;
}) {
  if (!content.url) return null;
  return (
    <>
      <h3 className="rk-title">{content.title || "វីដេអូ"}</h3>
      <p className="rk-sub">Video</p>
      <div style={videoWrap}>
        <iframe
          src={content.url}
          style={videoFrame}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="event video"
        />
      </div>
      {content.caption && <p className="rk-body en">{content.caption}</p>}
    </>
  );
}

// ── KHQR ──
export function KhmerKhqr({
  content,
}: {
  content: { title?: string; recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string };
  theme: ThemeTokens;
}) {
  if (!content.qrImageUrl) return null;
  return (
    <>
      <h3 className="rk-title">{content.title || "ចូលរួមចំណងដៃ"}</h3>
      <p className="rk-sub">Support Us Building Our Family</p>
      <Image
        src={content.qrImageUrl}
        alt="KHQR"
        width={220}
        height={220}
        unoptimized
        style={{ width: "58%", maxWidth: 160, display: "block", margin: "0.4rem auto 0", borderRadius: 4 }}
      />
      {content.recipientName && <p className="rk-body" style={{ marginTop: "0.5rem" }}>{content.recipientName}</p>}
    </>
  );
}

// ── Wishing (red panel) ──
export function KhmerWishing({
  invitationId,
  initialWishes,
  content,
}: {
  invitationId: string;
  initialWishes: InviteWish[];
  content: { placeholder?: string; title?: string };
  theme: ThemeTokens;
}) {
  const { wishes, name, setName, message, setMessage, submitting, submitted, error, handleSubmit } = useWishForm(
    invitationId,
    initialWishes
  );

  return (
    <>
      <h3 className="rk-title cream-on-red">{content.title || "សៀវភៅជូនពរ"}</h3>
      <p className="rk-sub on-red">Wishing Book</p>
      <form onSubmit={handleSubmit} className="inv-wish-form">
        <input
          className="inv-wish-input"
          style={{ borderColor: "rgba(212,175,55,0.4)", color: "#f9f7f4" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ឈ្មោះរបស់អ្នក / Your Name"
          required
        />
        <input
          className="inv-wish-input"
          style={{ borderColor: "rgba(212,175,55,0.4)", color: "#f9f7f4" }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={content.placeholder || "សារជូនពរ / Your wishes…"}
          required
        />
        {error && <p style={{ margin: 0, color: "#fecaca", fontSize: "0.8rem" }}>{error}</p>}
        {submitted && <p style={{ margin: 0, color: "#d4af37", fontSize: "0.8rem" }}>Sent! 💌</p>}
        <button className="inv-wish-send" type="submit" disabled={submitting} style={{ background: "#d4af37", color: "#5a0016" }}>
          {submitting ? "Sending…" : "ផ្ញើសារជូនពរ / Send Wishes"}
        </button>
      </form>
      {wishes.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          {wishes.slice(0, 6).map((w) => (
            <div key={w.id} className="inv-wish" style={{ background: "rgba(0,0,0,0.15)", borderColor: "rgba(212,175,55,0.3)" }}>
              <p className="inv-wish-msg" style={{ color: "#f9f7f4" }}>&ldquo;{w.message}&rdquo;</p>
              <p className="inv-wish-from" style={{ color: "#d4af37" }}>— {w.guestName}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const lightboxBg: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.9)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  cursor: "zoom-out",
};
const lightboxImg: React.CSSProperties = {
  maxWidth: "100%",
  maxHeight: "90vh",
  objectFit: "contain",
  borderRadius: "8px",
  cursor: "default",
};
const videoWrap: React.CSSProperties = { position: "relative", paddingTop: "56.25%", maxWidth: "480px", margin: "0 auto" };
const videoFrame: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  border: "none",
  borderRadius: "12px",
};
