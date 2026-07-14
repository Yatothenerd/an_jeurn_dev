"use client";

// Shared "recently used colors" history for every color picker in the admin —
// mirrors Canva's recent-swatches row so a color picked once is one click away
// everywhere else. Client-only (localStorage); no-ops during SSR.

import { useCallback, useEffect, useState } from "react";

const KEY = "anjeurn:recent-colors";
const CHANGE_EVENT = "anjeurn:recent-colors-changed";
const MAX = 12;

export function getRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentColor(hex: string): string[] {
  if (typeof window === "undefined" || !/^#[0-9a-fA-F]{6}$/.test(hex)) return getRecentColors();
  const lower = hex.toLowerCase();
  const next = [lower, ...getRecentColors().filter((c) => c.toLowerCase() !== lower)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    // Every other picker on the page (there are often several at once —
    // per-agenda-row swatches, title/header/body colors, …) refreshes too.
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // storage full/unavailable — recent colors are a nicety, not critical
  }
  return next;
}

/** Live-synced recent-colors list + a setter that records a pick and updates
 *  every other mounted picker on the page. Use with <RecentColorSwatches>. */
export function useRecentColors(): [string[], (hex: string) => void] {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecentColors());
    const onChange = () => setRecent(getRecentColors());
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const record = useCallback((hex: string) => setRecent(pushRecentColor(hex)), []);
  return [recent, record];
}
