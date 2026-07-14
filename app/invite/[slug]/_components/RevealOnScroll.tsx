"use client";

/**
 * Wraps a rendered section so it plays a staggered GSAP entrance the first
 * time it scrolls into view. The pre-JS hidden state (by data-effect) lives
 * in .inv-reveal CSS (standard-css.ts) so there's no flash of unstyled
 * content before hydration; GSAP owns the actual reveal. Distinct from the
 * gate's .inv-animate cascade, which only plays once when the gate opens.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export type SectionEffect = "none" | "fade" | "slide-up" | "slide-down" | "zoom";

export function RevealOnScroll({ effect, children }: { effect: SectionEffect; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (effect === "none" || !el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const targets = el.querySelectorAll(":scope > *");
    const els = targets.length > 0 ? Array.from(targets) : [el];
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: "power3.out", stagger: 0.07 });
      },
    });
    return () => trigger.kill();
  }, [effect]);

  return (
    <div ref={ref} data-effect={effect}>
      {children}
    </div>
  );
}
