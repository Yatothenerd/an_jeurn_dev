"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  musicUrl: string;
  theme: { btnBg: string; btnText: string };
}

export function MusicPlayer({ musicUrl, theme }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  // Attempt autoplay on mount (will fail silently in most browsers — user can tap)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    return () => { audio.pause(); };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => setError(true));
      setPlaying(true);
    }
  }

  if (error) return null;

  return (
    <div style={s.wrapper}>
      <audio ref={audioRef} src={musicUrl} loop preload="none" />
      <button
        onClick={toggle}
        style={{ ...s.btn, background: theme.btnBg, color: theme.btnText }}
        title={playing ? "Pause music" : "Play music"}
        aria-label={playing ? "Pause background music" : "Play background music"}
      >
        {playing ? "⏸" : "🎵"}
      </button>
    </div>
  );
}

const s = {
  wrapper: {
    position: "fixed" as const,
    bottom: "5rem",
    right: "1.25rem",
    zIndex: 100,
  },
  btn: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    fontSize: "1.125rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  },
} as const;
