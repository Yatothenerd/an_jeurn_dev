"use client";

import { usePathname } from "next/navigation";
import type { TransitionStyle } from "@/lib/services/site-settings.service";

// Rendered inside app/template.tsx, which React remounts on every route change.
// That remount is what makes the CSS animation replay on each navigation, giving
// the page-to-page transition effect. The actual style is admin-configurable.
export function PageTransition({
  style,
  children,
}: {
  style: TransitionStyle;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The invitation page uses `position: fixed` full-viewport backgrounds and its
  // own gate reveal. A finished `transform` animation (fill-mode: both) leaves a
  // lingering identity transform that turns this wrapper into the containing
  // block for those fixed backgrounds — stretching them to document height and
  // distorting the image. Skip the wrapper entirely on /invite/* so the fixed
  // backgrounds stay locked to the viewport.
  if (style === "none" || pathname?.startsWith("/invite/")) return <>{children}</>;
  return <div className={`pt pt-${style}`}>{children}</div>;
}
