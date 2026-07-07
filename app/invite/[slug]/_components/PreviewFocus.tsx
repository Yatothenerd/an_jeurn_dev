"use client";

/**
 * PreviewFocus — editor-only helper (rendered when ?preview=1).
 *
 * Keeps the ThemeEditor's live preview in sync with what the admin is editing:
 *  • `?focus=<sectionType>` on load → skip the gate and land on that section.
 *  • postMessage {type:"anjeurn:focus", section} from the parent frame →
 *    scroll to the section live, without reloading the iframe.
 * Editing the cover keeps/reloads the gate view instead (the gate IS the cover).
 *
 * Scrolling retries a few times: the gate unlocks body scrolling on a React
 * re-render, so the first attempt can land while overflow is still hidden.
 */

import { useEffect } from "react";

export function PreviewFocus({ initial }: { initial?: string }) {
  useEffect(() => {
    let cancelled = false;

    const focusSec = (type: string) => {
      const attempt = (n: number) => {
        if (cancelled || n > 6) return;
        // Re-dispatch each attempt — the gate's listener may mount after us.
        window.dispatchEvent(new Event("anjeurn:gate-skip"));
        // Smooth first; instant on retries (smooth animation is throttled in
        // backgrounded iframes and may never actually move the page).
        const behavior: ScrollBehavior = n === 0 ? "smooth" : "auto";
        if (type === "cover") {
          window.scrollTo({ top: 0, behavior });
          return;
        }
        const el = document.getElementById(`inv-sec-${type}`);
        if (el) el.scrollIntoView({ behavior, block: "start" });
        setTimeout(() => {
          if (cancelled) return;
          const target = document.getElementById(`inv-sec-${type}`);
          // Retry until the section actually reached the top of the viewport.
          if (!target || Math.abs(target.getBoundingClientRect().top) > 40) attempt(n + 1);
        }, 300);
      };
      attempt(0);
    };

    if (initial && initial !== "cover") {
      // Wait one tick so sibling effects (the gate's listener) are attached.
      setTimeout(() => focusSec(initial), 120);
    }

    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; section?: string } | null;
      if (d && d.type === "anjeurn:focus" && typeof d.section === "string") focusSec(d.section);
    };
    window.addEventListener("message", onMsg);
    return () => {
      cancelled = true;
      window.removeEventListener("message", onMsg);
    };
  }, [initial]);

  return null;
}
