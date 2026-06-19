"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Map button — shown when the event has a venue map link. */
  venueMapUrl?: string | null;
  /** Music toggle — shown when a background track is set (package: hasMusic). */
  musicUrl?: string | null;
  /** ABA / KHQR jump — shown when a contribution section exists (package: hasKhqr). */
  hasKhqr: boolean;
  theme: { btnBg: string; btnText: string };
}

// Floating overlay action stack on the invitation. Each button only appears when
// its underlying feature is present — which is itself gated by the client's
// package (music uploaded, KHQR section added, venue map set).
export function InviteActions({ venueMapUrl, musicUrl, hasKhqr, theme }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [musicFailed, setMusicFailed] = useState(false);

  // Attempt autoplay on mount (browsers usually block it — the user can tap).
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
  if (!venueMapUrl && !showMusic && !hasKhqr) return null;

  const btn = { ...s.btn, background: theme.btnBg, color: theme.btnText };

  return (
    <div style={s.stack}>
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" />}

      {hasKhqr && (
        <button onClick={scrollToKhqr} style={btn} title="Gift / ABA KHQR" aria-label="Go to contribution section">
          🎁
        </button>
      )}
      {venueMapUrl && (
        <button onClick={openMap} style={btn} title="Get directions" aria-label="Open venue map">
          📍
        </button>
      )}
      {showMusic && (
        <button
          onClick={toggleMusic}
          style={btn}
          title={playing ? "Mute music" : "Play music"}
          aria-label={playing ? "Mute background music" : "Play background music"}
        >
          {playing ? "🔊" : "🔈"}
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
    fontSize: "1.15rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
  },
} as const;
