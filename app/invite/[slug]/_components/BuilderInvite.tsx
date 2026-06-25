"use client";

/**
 * Live guest-facing invitation rendered from the EventBuilder state, using the
 * same shared canvas components as the admin preview — so what the editor shows
 * is exactly what guests see. Always portrait (centered phone-width column).
 */

import { useState } from "react";
import { type BuilderState, PvCover, PvContent, GuideOverlay, canvasStyles } from "@/lib/builder/canvas";

const biStyles = `
.bi-root { min-height: 100vh; background: #05070b; display: flex; justify-content: center; }
.bi-frame { position: relative; width: 100%; max-width: 480px; min-height: 100vh; background: #11151c; color: #fff; overflow-x: hidden; }
.bi-frame > .pv-cover, .bi-frame > .pv-content { min-height: 100vh; }
`;

export function BuilderInvite({ state, guestName }: { state: BuilderState; guestName?: string }) {
  const [opened, setOpened] = useState(false);
  const [coverGuideOff, setCoverGuideOff] = useState(false);
  const [contentGuideOff, setContentGuideOff] = useState(false);
  // Video "lock until end": until the cover clip finishes, no tap/drag.
  const [locked, setLocked] = useState(state.coverBg.kind === "video" && state.coverBg.lockUntilEnd);

  return (
    <div className="bi-root">
      <style>{canvasStyles + biStyles}</style>
      <div className="bi-frame">
        {!opened ? (
          <>
            <PvCover st={state} onOpen={() => setOpened(true)} locked={locked} onVideoEnded={() => setLocked(false)} guestNameValue={guestName} />
            {state.coverGuide.enabled && !coverGuideOff && !locked && (
              <GuideOverlay guide={state.coverGuide} onDismiss={() => setCoverGuideOff(true)} />
            )}
          </>
        ) : (
          <>
            {state.keepCover && <PvCover st={state} guestNameValue={guestName} />}
            <PvContent st={state} />
            {state.contentGuide.enabled && !contentGuideOff && (
              <GuideOverlay guide={state.contentGuide} onDismiss={() => setContentGuideOff(true)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
