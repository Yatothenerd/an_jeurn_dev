"use client";

/**
 * StyleControls — the shared trio of text-styling inputs used wherever the
 * admin edits a text box:
 *   • FontPicker  — dropdown + live preview line rendered in the chosen font.
 *   • ColorField  — swatch picker + exact hex value (editable text).
 *   • SizeField   — slider + numeric input showing the exact value.
 * Used by the theme setup (font scheme) and by per-section fine-tuning.
 */

import type { FontOption } from "@/lib/themes/shared/standard-css";

const ctl = {
  row: { display: "flex", alignItems: "center", gap: "0.5rem" },
  label: { fontSize: "0.72rem", fontWeight: 600, color: "var(--c-muted)" },
  select: {
    flex: 1, minWidth: 0, padding: "0.4rem 0.5rem", borderRadius: 8,
    border: "1px solid var(--c-border)", background: "var(--c-surface-2)",
    color: "var(--c-text)", fontSize: "0.82rem", fontFamily: "inherit",
  },
  preview: {
    padding: "0.45rem 0.7rem", borderRadius: 8, border: "1px dashed var(--c-border)",
    background: "var(--c-surface)", color: "var(--c-text)", fontSize: "1.05rem",
    lineHeight: 1.4, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis",
  },
  swatch: {
    width: 34, height: 26, padding: 0, border: "1px solid var(--c-border)",
    borderRadius: 6, background: "none", cursor: "pointer", flexShrink: 0,
  },
  hexInput: {
    width: 84, padding: "0.35rem 0.5rem", borderRadius: 7,
    border: "1px solid var(--c-border)", background: "var(--c-surface-2)",
    color: "var(--c-text)", fontSize: "0.78rem", fontFamily: "ui-monospace, monospace",
  },
  range: { flex: 1, minWidth: 0, accentColor: "var(--c-accent)" },
  numInput: {
    width: 64, padding: "0.35rem 0.4rem", borderRadius: 7, textAlign: "right" as const,
    border: "1px solid var(--c-border)", background: "var(--c-surface-2)",
    color: "var(--c-text)", fontSize: "0.78rem", fontFamily: "ui-monospace, monospace",
  },
  unit: { fontSize: "0.7rem", color: "var(--c-muted)", width: 24 },
  clear: {
    padding: "0.2rem 0.45rem", borderRadius: 6, border: "1px solid var(--c-border)",
    background: "transparent", color: "var(--c-muted)", fontSize: "0.7rem", cursor: "pointer", flexShrink: 0,
  },
} as const;

// ── Font picker with live preview ─────────────────────────────────────────────

export function FontPicker({
  value,
  onChange,
  options,
  previewText = "Sophea & Dara — អញ្ជើញ",
  allowThemeDefault = true,
}: {
  /** Current font stack ("" = theme default). */
  value: string;
  onChange: (stack: string) => void;
  options: FontOption[];
  previewText?: string;
  allowThemeDefault?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={ctl.select}
      >
        {allowThemeDefault && <option value="">Theme default</option>}
        {options.map((f) => (
          <option key={f.label} value={f.stack} style={{ fontFamily: f.stack }}>
            {f.label}
          </option>
        ))}
      </select>
      {/* Live preview — rendered in the picked font */}
      <div style={{ ...ctl.preview, fontFamily: value || "inherit" }} title={value || "Theme default"}>
        {previewText}
      </div>
    </div>
  );
}

// ── Color picker with exact value display ─────────────────────────────────────

function toHex(c: string): string {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  if (/^#[0-9a-f]{3}$/i.test(c)) return "#" + c.slice(1).split("").map((ch) => ch + ch).join("");
  return "#888888";
}

export function ColorField({
  value,
  onChange,
  allowEmpty = true,
}: {
  /** Hex color ("" = theme default when allowEmpty). */
  value: string;
  onChange: (hex: string) => void;
  allowEmpty?: boolean;
}) {
  const set = value !== "";
  return (
    <div style={ctl.row}>
      <input
        type="color"
        value={toHex(value || "#888888")}
        style={{ ...ctl.swatch, opacity: set ? 1 : 0.45 }}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Pick color"
      />
      <input
        type="text"
        value={value}
        placeholder="theme"
        spellCheck={false}
        style={ctl.hexInput}
        onChange={(e) => {
          const v = e.target.value.trim();
          if (v === "" || /^#?[0-9a-fA-F]{0,8}$/.test(v)) onChange(v === "" || v.startsWith("#") ? v : "#" + v);
        }}
        aria-label="Exact color value"
      />
      {allowEmpty && set && (
        <button type="button" style={ctl.clear} title="Reset to theme default" onClick={() => onChange("")}>
          ✕
        </button>
      )}
    </div>
  );
}

// ── Size slider with exact numeric input ──────────────────────────────────────

export function SizeField({
  value,
  onChange,
  min = 0.6,
  max = 1.6,
  step = 0.05,
  unit = "×",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div style={ctl.row}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={ctl.range}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-label="Size slider"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        style={ctl.numInput}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        aria-label="Exact size"
      />
      <span style={ctl.unit}>{unit}</span>
    </div>
  );
}
