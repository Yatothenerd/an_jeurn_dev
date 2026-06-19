"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

// Scroll-triggered fade-up using anime.js. Universal site animation for invite
// sections. Starts hidden (revealed under the opening gate, so no flash) and
// animates in once on first viewport entry. Honors prefers-reduced-motion.
export function Reveal({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      el.style.opacity = "1";
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          anime({
            targets: el,
            opacity: [0, 1],
            translateY: [26, 0],
            duration: 700,
            easing: "easeOutCubic",
          });
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Hidden until revealed (gate covers the page initially, so no FOUC).
  return (
    <div ref={ref} style={{ opacity: 0, ...style }}>
      {children}
    </div>
  );
}
