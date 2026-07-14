"use client";

/**
 * Wraps a rendered section so it plays an entrance transition the first time
 * it scrolls into view (see .inv-reveal in standard-css.ts for the actual
 * transform/opacity per effect). Distinct from the gate's .inv-animate
 * cascade, which only plays once when the gate opens.
 */

import { useEffect, useRef, useState } from "react";

export type SectionEffect = "none" | "fade" | "slide-up" | "slide-down" | "zoom";

export function RevealOnScroll({ effect, children }: { effect: SectionEffect; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isIn, setIsIn] = useState(effect === "none");

  useEffect(() => {
    if (effect === "none" || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIn(true);
          io.disconnect(); // plays once
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [effect]);

  return (
    <div ref={ref} className={`inv-reveal${isIn ? " is-in" : ""}`} data-effect={effect}>
      {children}
    </div>
  );
}
