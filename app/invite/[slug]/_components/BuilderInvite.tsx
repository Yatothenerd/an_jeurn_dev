"use client";

/**
 * Live guest-facing invitation rendered from the EventBuilder state, using the
 * same shared canvas components as the admin preview — so what the editor shows
 * is exactly what guests see. Always portrait (centered phone-width column).
 */

import { useState, useEffect, useRef } from "react";
import { type BuilderState, type Background, PvCover, PvContent, GuideOverlay, FloatingOverlayButtons, LangSwitcher, canvasStyles } from "@/lib/builder/canvas";

const biStyles = `
.bi-outer { min-height: 100vh; display: flex; justify-content: center; position: relative; }
.bi-outer-bg { position: fixed; inset: 0; z-index: 0; }
.bi-outer-bg video { width: 100%; height: 100%; object-fit: cover; }
.bi-frame { position: relative; z-index: 1; width: 100%; max-width: 480px; min-height: 100vh; background: #11151c; color: #fff; overflow-x: hidden; }
.bi-frame > .pv-cover, .bi-frame > .pv-content { min-height: 100vh; }
`;

function outerBgCss(bg: Background | undefined): React.CSSProperties {
  if (!bg) return { background: "#05070b" };
  if (bg.kind === "color") return { background: bg.color };
  if ((bg.kind === "photo" || bg.kind === "gif") && bg.imageUrl)
    // Use longhand backgroundColor — the `background` shorthand would reset
    // (erase) backgroundImage, so the uploaded image never rendered.
    return { backgroundColor: bg.color || "#05070b", backgroundImage: `url(${bg.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" };
  return { background: "#05070b" };
}

export function BuilderInvite({ state, guestName }: { state: BuilderState; guestName?: string }) {
  const [opened, setOpened] = useState(false);
  const [contentGuideOff, setContentGuideOff] = useState(false);
  const [locked, setLocked] = useState(state.coverBg.kind === "video" && state.coverBg.lockUntilEnd);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lang, setLang] = useState<"kh" | "en">("kh");
  const hasBothLangs = !!(state.langs?.khmer && state.langs?.english);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const music = state.music;
  const ob = state.overlayButtons ?? { playPause: false, map: false, wishGift: false, scrollBack: false };
  const outerBg = state.outerBg;

  // Set up audio element once
  useEffect(() => {
    if (!music?.url) return;
    const audio = new Audio(music.url);
    audio.loop = true;
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, [music?.url]);

  const playMusic = () => {
    if (audioRef.current && music?.url) {
      audioRef.current.play().catch(() => {});
    }
  };

  function toggleMusic() {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  }

  // Play on first scroll/touch if playOnScroll is enabled
  useEffect(() => {
    if (!opened || !music?.playOnScroll || !music.url) return;
    const once = () => { playMusic(); };
    window.addEventListener("scroll", once, { once: true, passive: true });
    window.addEventListener("touchstart", once, { once: true, passive: true });
    return () => {
      window.removeEventListener("scroll", once);
      window.removeEventListener("touchstart", once);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, music?.playOnScroll, music?.url]);

  function handleOpen() {
    setOpened(true);
    if (state.keepCover) {
      setTimeout(() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" }), 150);
    }
    if (music?.playOnLoad && music.url) {
      setTimeout(() => playMusic(), 300);
    }
  }

  function handleVideoEnded() {
    setLocked(false);
    if (music?.playAfterVideoEnd && music.url) {
      playMusic();
    }
  }

  function scrollToSection(kind: "map" | "wishing") {
    const selector = kind === "map" ? ".pv-map" : ".pv-wishing";
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="bi-outer" style={outerBgCss(outerBg)}>
      {/* dangerouslySetInnerHTML: React HTML-escapes text children of <style>
          on the server, breaking attribute selectors pre-hydration. */}
      <style dangerouslySetInnerHTML={{ __html: canvasStyles + biStyles }} />
      {/* Outer video background (desktop/laptop only) */}
      {outerBg?.kind === "video" && outerBg.videoUrl && (
        <div className="bi-outer-bg">
          <video src={outerBg.videoUrl} autoPlay loop muted playsInline />
        </div>
      )}
      <div className="bi-frame">
        {!opened ? (
          // The cover shows NO overlaid guide — the animated Open button (below)
          // is the affordance. Any gesture guide appears only after opening.
          <PvCover st={state} onOpen={handleOpen} locked={locked} onVideoEnded={handleVideoEnded} guestNameValue={guestName} lang={lang} />
        ) : (
          <>
            {state.keepCover && <PvCover st={state} guestNameValue={guestName} lang={lang} />}
            <PvContent st={state} lang={lang} />
            {state.contentGuide.enabled && !contentGuideOff && (
              <GuideOverlay guide={state.contentGuide} onDismiss={() => setContentGuideOff(true)} />
            )}
          </>
        )}
      </div>
      {hasBothLangs && <LangSwitcher lang={lang} onChange={setLang} />}
      {opened && (
        <FloatingOverlayButtons
          ob={ob}
          isPlaying={isPlaying}
          onPlayPause={toggleMusic}
          onScrollBack={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onMap={() => scrollToSection("map")}
          onWish={() => scrollToSection("wishing")}
        />
      )}
    </div>
  );
}
