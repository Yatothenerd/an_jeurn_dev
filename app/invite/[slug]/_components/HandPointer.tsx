"use client";

import type { CSSProperties } from "react";

// Redesigned flat-design pointing hand: smooth bezier finger curves, proper
// proportions, and a pinky for a natural look.
export function HandPointer({
  color = "currentColor",
  className,
  style,
}: {
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 48 72"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <g fill={color}>
        {/* Index finger — tall, slender, smooth top */}
        <path d="M13 2Q13 0 17 0Q21 0 21 2L21 38Q21 42 17 42Q13 42 13 38Z" />
        {/* Middle finger — folded, stepped down */}
        <path d="M21 22Q21 18 25 18Q29 18 29 22L29 37Q29 40 25 40Q21 40 21 37Z" />
        {/* Ring finger */}
        <path d="M29 26Q29 23 33 23Q37 23 37 26L37 37Q37 40 33 40Q29 40 29 37Z" />
        {/* Pinky — subtle tip visible */}
        <path d="M37 30Q37 28 40 28Q43 28 43 30L43 37Q43 39 40 39Q37 39 37 37Z" />
        {/* Palm — wide, rounded base */}
        <rect x="9" y="38" width="34" height="26" rx="13" />
        {/* Thumb */}
        <rect x="3" y="43" width="10" height="19" rx="5" transform="rotate(-20 8 52)" />
      </g>
    </svg>
  );
}
