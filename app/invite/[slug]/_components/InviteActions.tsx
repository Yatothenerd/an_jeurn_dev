"use client";

import { useEffect, useRef, useState } from "react";
import type { DesignFloatButtons } from "@/lib/themes/design";

interface Props {
  venueMapUrl?: string | null;
  musicUrl?: string | null;
  hasKhqr: boolean;
  showRsvp?: boolean;
  theme: { btnBg: string; btnText: string };
  /** Position / shape / size / hover / visibility — design.page.floatButtons. */
  config?: DesignFloatButtons;
}

// ── Flat SVG icons ────────────────────────────────────────────────────────────

function IconGift({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* flat gift box */}
      <path d="M4 10h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" />
      <path d="M3 6.5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2z" />
      <rect x="10.5" y="6" width="3" height="15" rx="0.5" fill="rgba(0,0,0,0.28)" />
      {/* bow */}
      <path d="M12 6C10.5 6 7.5 4 8.4 2.4 9.2 1 12 3 12 6z" />
      <path d="M12 6C13.5 6 16.5 4 15.6 2.4 14.8 1 12 3 12 6z" />
    </svg>
  );
}

function IconRsvp({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 1.5L12 12l7.6-5.5H4.4z" />
    </svg>
  );
}

function IconMapPin({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c-3.87 0-7 3.13-7 7 0 4.42 5.5 11.14 6.65 12.5a.45.45 0 0 0 .7 0C13.5 20.14 19 13.42 19 9c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.6" fill="rgba(0,0,0,0.3)" />
    </svg>
  );
}

function IconPlay({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14a1 1 0 0 1 1.53-.85l10 6.86a1 1 0 0 1 0 1.7l-10 6.86A1 1 0 0 1 8 18.86V5.14z" />
    </svg>
  );
}

function IconPause({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: DesignFloatButtons = {
  position: "right",
  shape: "circle",
  size: 46,
  hover: "lift",
  show: { rsvp: true, khqr: true, map: true, music: true },
};

export function InviteActions({ venueMapUrl, musicUrl, hasKhqr, showRsvp = true, theme, config }: Props) {
  const cfg = config ?? DEFAULT_CONFIG;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [musicFailed, setMusicFailed] = useState(false);

  useEffect(() => {
    if (!musicUrl) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    return () => audio.pause();
  }, [musicUrl]);

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setMusicFailed(true));
    }
  }

  function openMap() {
    if (venueMapUrl) window.open(venueMapUrl, "_blank", "noopener,noreferrer");
  }

  function scrollToKhqr() {
    document.getElementById("inv-sec-khqr")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const showMusic = !!musicUrl && !musicFailed;

  function openRsvp() {
    window.dispatchEvent(new CustomEvent("anjeurn:open-rsvp"));
  }

  const size = Math.max(36, Math.min(72, cfg.size || 46));
  const iconSize = Math.round(size * 0.48);
  const btnClass = `inv-fab shape-${cfg.shape} hv-${cfg.hover}`;
  const btnStyle: React.CSSProperties = {
    width: size,
    height: size,
    background: theme.btnBg,
    color: theme.btnText,
  };

  const buttons = [
    cfg.show.rsvp && showRsvp && (
      <button key="rsvp" onClick={openRsvp} className={btnClass} style={btnStyle} title="RSVP" aria-label="Open RSVP form">
        <IconRsvp size={iconSize} />
      </button>
    ),
    cfg.show.khqr && hasKhqr && (
      <button key="khqr" onClick={scrollToKhqr} className={btnClass} style={btnStyle} title="Gift / ABA KHQR" aria-label="Go to contribution section">
        <IconGift size={iconSize} />
      </button>
    ),
    cfg.show.map && venueMapUrl && (
      <button key="map" onClick={openMap} className={btnClass} style={btnStyle} title="Get directions" aria-label="Open venue map">
        <IconMapPin size={iconSize} />
      </button>
    ),
    cfg.show.music && showMusic && (
      <button
        key="music"
        onClick={toggleMusic}
        className={btnClass}
        style={btnStyle}
        title={playing ? "Mute music" : "Play music"}
        aria-label={playing ? "Mute background music" : "Play background music"}
      >
        {playing ? <IconPause size={iconSize} /> : <IconPlay size={iconSize} />}
      </button>
    ),
  ].filter(Boolean);

  return (
    <div className="inv-fab-wrap">
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" />}
      {buttons.length > 0 && <div className={`inv-fab-stack pos-${cfg.position}`}>{buttons}</div>}
    </div>
  );
}
