"use client";

import { useEffect, useState, useRef } from "react";
import type { Theme } from "@/types";

interface Props {
  theme: Theme;
  onClose: () => void;
}

export function ThemePreviewModal({ theme, onClose }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function measure() {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (!mobile) {
        // Scale phone frame to fit viewport height with margin
        const availH = window.innerHeight - 120; // top label + close btn
        const phoneH = 812;
        setScale(Math.min(1, availH / phoneH));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const previewUrl = `/preview/theme/${theme.id}`;

  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000" }}>
        <iframe
          src={previewUrl}
          title={`Preview: ${theme.name}`}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
        <button
          onClick={onClose}
          aria-label="Close preview"
          style={pm.mobileClose}
        >
          ✕
        </button>
      </div>
    );
  }

  // Phone frame dimensions
  const PHONE_W = 375;
  const PHONE_H = 812;

  return (
    <div style={pm.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={pm.container} ref={containerRef}>
        {/* Theme name label */}
        <div style={pm.label}>
          <span style={pm.labelIcon}>{theme.contentType === "photo" ? "🖼" : "✏️"}</span>
          <span>{theme.name}</span>
          {theme.isAnimated && <span style={pm.animBadge}>✦ Animated</span>}
        </div>

        {/* Phone wrapper (handles scale) */}
        <div style={{
          width: PHONE_W * scale,
          height: PHONE_H * scale,
          position: "relative",
          flexShrink: 0,
        }}>
          {/* Actual phone at native size, scaled via transform */}
          <div style={{
            ...pm.phone,
            width: PHONE_W,
            height: PHONE_H,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}>
            {/* Dynamic island */}
            <div style={pm.dynamicIsland} />

            {/* Status bar */}
            <div style={pm.statusBar}>
              <span style={pm.statusTime}>9:41</span>
              <div style={pm.statusIcons}>
                <span>▐▐▐</span>
                <span>WiFi</span>
                <span>🔋</span>
              </div>
            </div>

            {/* Screen / iframe */}
            <div style={pm.screen}>
              <iframe
                src={previewUrl}
                title={`Preview: ${theme.name}`}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              />
            </div>

            {/* Home indicator */}
            <div style={pm.homeBar} />
          </div>
        </div>

        {/* Controls */}
        <div style={pm.controls}>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={pm.openLink}>
            Open full page ↗
          </a>
          <button onClick={onClose} style={pm.closeBtn}>✕ Close</button>
        </div>
      </div>
    </div>
  );
}

const pm = {
  backdrop: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 100,
    background: "rgba(0,0,0,0.82)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "1rem",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#fff",
    fontSize: "0.9375rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  labelIcon: { fontSize: "1.1rem" },
  animBadge: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    background: "rgba(255,255,255,0.15)",
    borderRadius: "999px",
    padding: "0.2rem 0.5rem",
    color: "#e5c97a",
  },

  phone: {
    background: "#1c1c1e",
    borderRadius: 55,
    padding: "52px 12px 22px",
    boxShadow: [
      "inset 0 0 0 1px rgba(255,255,255,0.08)",
      "0 0 0 2px #2c2c2e",
      "0 0 0 4px #3a3a3c",
      "0 40px 120px rgba(0,0,0,0.8)",
    ].join(", "),
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
  },

  dynamicIsland: {
    position: "absolute" as const,
    top: 14,
    left: "50%",
    transform: "translateX(-50%)",
    width: 120,
    height: 34,
    background: "#000",
    borderRadius: 20,
    zIndex: 5,
  },

  statusBar: {
    position: "absolute" as const,
    top: 16,
    left: 28,
    right: 28,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 6,
    pointerEvents: "none" as const,
  },
  statusTime: {
    color: "rgba(255,255,255,0.0)", // hidden under the island; real status bar would sit beside it
    fontSize: "0.8125rem",
    fontWeight: 600,
  },
  statusIcons: {
    display: "flex",
    gap: "0.25rem",
    alignItems: "center",
    fontSize: "0.5rem",
    color: "rgba(255,255,255,0)",
  },

  screen: {
    flex: 1,
    borderRadius: 44,
    overflow: "hidden",
    background: "#000",
    position: "relative" as const,
  },

  homeBar: {
    width: 130,
    height: 5,
    background: "rgba(255,255,255,0.28)",
    borderRadius: 3,
    margin: "10px auto 0",
    flexShrink: 0,
  },

  controls: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  openLink: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "0.875rem",
    textDecoration: "none",
    padding: "0.4rem 0.875rem",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  closeBtn: {
    padding: "0.4rem 1rem",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
  },

  mobileClose: {
    position: "fixed" as const,
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
} as const;
