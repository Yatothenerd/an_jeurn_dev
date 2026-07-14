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

// Wraps a text-based section's content in its admin-uploaded background image
// (with a scrim + light text), when one is set. Otherwise renders plainly.
function withBg(bgUrl: string | undefined, children: React.ReactNode) {
  if (!bgUrl) return <>{children}</>;
  return (
    <div className="rk-bgpanel" style={{ backgroundImage: `url(${bgUrl})` }}>
      <div className="rk-bgpanel-inner">{children}</div>
    </div>
  );
}

// ── Cover ──
interface CoverContent {
  heading?: string;
  subheading?: string;
  guestLabel?: string;
  inviteKh?: string;
  graceKh?: string;
}

function KhmerKbachDiamond() {
  return (
    <svg viewBox="0 0 200 200" className="rk-kbach" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Outer tip spikes */}
      <path d="M100 2 L104 14 L100 20 L96 14 Z" fill="currentColor" opacity="0.8"/>
      <path d="M100 180 L104 186 L100 198 L96 186 Z" fill="currentColor" opacity="0.8"/>
      <path d="M2 100 L14 96 L20 100 L14 104 Z" fill="currentColor" opacity="0.8"/>
      <path d="M180 100 L186 96 L198 100 L186 104 Z" fill="currentColor" opacity="0.8"/>
      {/* Outer diamond frame */}
      <path d="M100 4 L196 100 L100 196 L4 100 Z" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      {/* Second outline */}
      <path d="M100 11 L189 100 L100 189 L11 100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6"/>
      {/* Dashed mid ring */}
      <path d="M100 24 L176 100 L100 176 L24 100 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2"/>
      {/* Middle ring */}
      <path d="M100 38 L162 100 L100 162 L38 100 Z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      {/* Inner ring */}
      <path d="M100 56 L144 100 L100 144 L56 100 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
      {/* Cardinal cross through center */}
      <line x1="100" y1="38" x2="100" y2="162" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
      <line x1="38" y1="100" x2="162" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
      {/* Inner X diagonals */}
      <line x1="56" y1="56" x2="144" y2="144" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
      <line x1="144" y1="56" x2="56" y2="144" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
      {/* Cardinal small diamonds between middle and inner ring */}
      <path d="M100 38 L104 47 L100 56 L96 47 Z" fill="currentColor" opacity="0.5"/>
      <path d="M100 144 L104 153 L100 162 L96 153 Z" fill="currentColor" opacity="0.5"/>
      <path d="M38 100 L47 96 L56 100 L47 104 Z" fill="currentColor" opacity="0.5"/>
      <path d="M144 100 L153 96 L162 100 L153 104 Z" fill="currentColor" opacity="0.5"/>
      {/* Diagonal corner diamonds between outer and middle rings */}
      <path d="M148 52 L152 56 L148 60 L144 56 Z" fill="currentColor" opacity="0.35"/>
      <path d="M52 52 L56 48 L60 52 L56 56 Z" fill="currentColor" opacity="0.35"/>
      <path d="M148 148 L152 144 L156 148 L152 152 Z" fill="currentColor" opacity="0.35"/>
      <path d="M44 148 L48 144 L52 148 L48 152 Z" fill="currentColor" opacity="0.35"/>
      {/* Center lotus */}
      <circle cx="100" cy="100" r="12" fill="none" stroke="currentColor" strokeWidth="1"/>
      <circle cx="100" cy="100" r="6" fill="currentColor" opacity="0.35"/>
      <circle cx="100" cy="100" r="2.5" fill="currentColor" opacity="0.8"/>
    </svg>
  );
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
    <div className="rk-cv2">
      {/* Left content */}
      <div className="rk-cv2-body">
        <div className="rk-cv2-left">
          <div>
            <p className="rk-cv2-kh">{content.inviteKh || "សូមគោរពអញ្ជើញ"}</p>
            {content.subheading && <p className="rk-cv2-en">{content.subheading}</p>}
          </div>
          <p className="rk-cv2-title">{content.heading || eventTitle}</p>
          <div className="rk-cv2-divider" />
          <div>
            <p className="rk-cv2-detail">{formatted}</p>
            {venueName && <p className="rk-cv2-detail">{venueName}</p>}
          </div>
          <div className="rk-cv2-guest-block">
            <p className="rk-cv2-guest-label">{content.graceKh || "ចូលរួម"}</p>
            <div className="rk-cv2-guestname">{guestName || `[ ${label} ]`}</div>
            <p className="rk-cv2-admit">{label} · One Admit Only</p>
          </div>
        </div>

        {/* Right ornament panel */}
        <div className="rk-cv2-right">
          <KhmerKbachDiamond />
          <KhmerKbachDiamond />
        </div>
      </div>

      {/* Bottom dark band */}
      <div className="rk-cv2-bottom" />
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
  content: { title?: string; subtitle?: string; items?: AgendaItem[]; bgUrl?: string };
  theme: ThemeTokens;
}) {
  const items = content.items ?? [];
  return withBg(
    content.bgUrl,
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
  content: {
    title?: string;
    items?: DetailItem[];
    bgUrl?: string;
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
  return withBg(
    content.bgUrl,
    <>
      <h3 className="rk-title">{content.title || "ព័ត៌មានលម្អិត"}</h3>
      <p className="rk-sub">Event Details</p>
      {items.map((item, i) => (
        <p key={i} className="rk-body">
          <strong>{item.label}:</strong> {item.value}
        </p>
      ))}
      {venueName && <p className="rk-body">{venueName}</p>}
      {mapUrl && (
        <div style={{ textAlign: "center" }}>
          <a className="rk-btn" href={mapUrl} target="_blank" rel="noreferrer">
            {content.mapLabel || "View on Map"}
          </a>
        </div>
      )}

      {content.dresscode && content.dresscode.length > 0 && (
        <div style={{ marginTop: "1.4rem", textAlign: "center" }}>
          <p className="rk-sub" style={{ marginBottom: "0.5rem" }}>{content.dresscodeLabel || "Dress code"}</p>
          {content.dresscodeText && <p className="rk-body">{content.dresscodeText}</p>}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.4rem" }}>
            {content.dresscode.map((c, i) => (
              <span key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "1px solid rgba(212,175,55,0.4)", display: "inline-block" }} />
            ))}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div style={{ marginTop: "1.4rem" }}>
          <p className="rk-sub" style={{ textAlign: "center", marginBottom: "0.5rem" }}>{content.notesLabel || "Notes"}</p>
          {notes.map((n, i) => (
            <p key={i} className="rk-body">{n}</p>
          ))}
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
