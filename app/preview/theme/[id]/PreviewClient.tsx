"use client";

import React, { useState, useEffect, useRef } from "react";

interface OverlayConfig {
  style: "floating" | "bottomBar";
  map:    { enabled: boolean };
  music:  { enabled: boolean };
  goToTop:{ enabled: boolean };
  gifts:  { enabled: boolean };
}

interface Props {
  overlay: OverlayConfig | null;
  musicUrl?: string | null;
  accentColor?: string;
  textColor?: string;
}

export function PreviewOverlay({ overlay, musicUrl, accentColor = "#c9a96e", textColor = "#ffffff" }: Props) {
  const [showTop, setShowTop]       = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    function onScroll() { setShowTop(window.scrollY > 250); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) { audio.pause(); } else { void audio.play(); }
    setMusicPlaying(p => !p);
  }

  if (!overlay) return null;

  const floatingBtns = overlay.style === "floating";
  const bottomBar    = overlay.style === "bottomBar";

  const fbStyle: React.CSSProperties = {
    width: 44, height: 44, borderRadius: "50%",
    background: "rgba(20,20,20,0.75)", backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.25rem", cursor: "pointer",
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
    color: textColor,
  };

  return (
    <>
      {musicUrl && (
        <audio ref={audioRef} src={musicUrl} autoPlay loop style={{ display: "none" }} />
      )}

      {floatingBtns && (
        <div style={{ position: "fixed", bottom: 90, right: 14, display: "flex", flexDirection: "column", gap: "0.625rem", zIndex: 10 }}>
          {overlay.music.enabled && (
            <button onClick={toggleMusic} aria-label={musicPlaying ? "Pause music" : "Play music"} style={fbStyle}>
              {musicPlaying ? "🎵" : "🔇"}
            </button>
          )}
          {overlay.goToTop.enabled && showTop && (
            <button onClick={scrollToTop} aria-label="Scroll to top" style={fbStyle}>⬆</button>
          )}
          {overlay.map.enabled   && <button aria-label="Open map" style={fbStyle}>🗺</button>}
          {overlay.gifts.enabled && <button aria-label="Gifts" style={fbStyle}>🎁</button>}
        </div>
      )}

      {bottomBar && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(10,10,10,0.85)", backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "0.625rem 1rem 1.5rem",
          display: "flex", justifyContent: "space-around", zIndex: 10,
        }}>
          {overlay.map.enabled     && <BarBtn icon="🗺"                                label="Map"   onClick={() => {}} textColor={textColor} />}
          {overlay.music.enabled   && <BarBtn icon={musicPlaying ? "🎵" : "🔇"}       label="Music" onClick={toggleMusic} textColor={textColor} />}
          {overlay.goToTop.enabled && <BarBtn icon="⬆"                                label="Top"   onClick={scrollToTop} textColor={textColor} />}
          {overlay.gifts.enabled   && <BarBtn icon="🎁"                                label="Gift"  onClick={() => {}} textColor={textColor} />}
        </div>
      )}
    </>
  );
}

function BarBtn({ icon, label, onClick, textColor }: { icon: string; label: string; onClick: () => void; textColor: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
        cursor: "pointer", opacity: 0.85,
        background: "none", border: "none", color: textColor, padding: "0.25rem 0.5rem",
      }}
    >
      <span style={{ fontSize: "1.25rem" }}>{icon}</span>
      <span style={{ fontSize: "0.5625rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
    </button>
  );
}
