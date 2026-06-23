"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  venueMapUrl?: string | null;
  musicUrl?: string | null;
  hasKhqr: boolean;
  showRsvp?: boolean;
  theme: { btnBg: string; btnText: string };
}

// ── Flat SVG icons ────────────────────────────────────────────────────────────

function IconGift({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="1.5" />
      <rect x="2" y="7" width="20" height="5" rx="1" />
      <rect x="11" y="7" width="2" height="15" />
      <rect x="2" y="9" width="20" height="2" />
      <path d="M12 7C10 7 7 4.5 8 2.5C9 0.5 12 3 12 7Z" />
      <path d="M12 7C14 7 17 4.5 16 2.5C15 0.5 12 3 12 7Z" />
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
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" fill="rgba(0,0,0,0.3)" />
    </svg>
  );
}

function IconSpeakerOn({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 9v6h4l5 5V4L7 9H3z" />
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
      <path d="M14 3.23v2.06C16.89 6.15 19 8.83 19 12s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function IconSpeakerOff({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 9v6h4l5 5V4L7 9H3z" />
      <path d="M19 11.29l-1.42-1.42L15 12.46l-2.58-2.59L11 11.29l2.58 2.59L11 16.46l1.42 1.42L15 15.29l2.58 2.59 1.42-1.42-2.59-2.58z" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InviteActions({ venueMapUrl, musicUrl, hasKhqr, showRsvp = true, theme }: Props) {
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
    document.getElementById("inv-khqr")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const showMusic = !!musicUrl && !musicFailed;

  function openRsvp() {
    window.dispatchEvent(new CustomEvent("anjeurn:open-rsvp"));
  }

  const btn: React.CSSProperties = { ...s.btn, background: theme.btnBg, color: theme.btnText };

  return (
    <div style={s.stack}>
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" />}

      {showRsvp && (
        <button onClick={openRsvp} style={btn} title="RSVP" aria-label="Open RSVP form">
          <IconRsvp />
        </button>
      )}

      {hasKhqr && (
        <button onClick={scrollToKhqr} style={btn} title="Gift / ABA KHQR" aria-label="Go to contribution section">
          <IconGift />
        </button>
      )}
      {venueMapUrl && (
        <button onClick={openMap} style={btn} title="Get directions" aria-label="Open venue map">
          <IconMapPin />
        </button>
      )}
      {showMusic && (
        <button
          onClick={toggleMusic}
          style={btn}
          title={playing ? "Mute music" : "Play music"}
          aria-label={playing ? "Mute background music" : "Play background music"}
        >
          {playing ? <IconSpeakerOn /> : <IconSpeakerOff />}
        </button>
      )}
    </div>
  );
}

const s = {
  stack: {
    position: "fixed" as const,
    bottom: "7rem",
    right: "1.25rem",
    zIndex: 100,
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.6rem",
  },
  btn: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
  },
} as const;
