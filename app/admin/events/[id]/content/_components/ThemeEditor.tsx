"use client";

/**
 * ThemeEditor — Step 3 (Content) of the event workflow. Live, DB-synchronized
 * editor for theme-module invitations.
 *
 * Left:  event basics + per-section content forms + color overrides.
 *        Every change autosaves to the database (debounced ~700ms) through the
 *        existing admin event PATCH / photos APIs.
 * Right: the REAL invite page (/invite/[slug]?preview=1) in a phone-sized
 *        iframe, reloaded automatically after each save — the preview always
 *        shows exactly what a guest sees (gate animation, theme CSS, scroll,
 *        mobile viewport), for any theme registered in lib/themes/registry.
 *
 * The theme itself is chosen in the Design step; publishing happens in the
 * Publish step — this editor deliberately does neither.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { HEADING_FONTS, BODY_FONTS, buildFontsHref } from "@/lib/themes/shared/standard-css";
import { FontPicker, ColorField, SizeField } from "@/app/admin/_components/StyleControls";
import { RecentColorSwatches } from "@/app/admin/_components/RecentColorSwatches";
import { useRecentColors } from "@/lib/utils/recent-colors";
import { DEFAULT_FLOAT_BUTTONS, type DesignFloatButtons, type GateElementKey, type SectionEffect } from "@/lib/themes/design";
import { GATE_DEFAULT_POSITIONS } from "@/app/invite/[slug]/_components/InviteGate";

// ── Types ────────────────────────────────────────────────────────────────────

interface EventData {
  id: string; title: string; eventType: string; eventDate: string;
  venueName: string | null; venueMapUrl: string | null; slug: string;
}
interface InvitationData {
  id: string | null;
  overlayConfig: Record<string, unknown> | null;
  defaultSections: unknown;
  coverUrl: string | null;
  musicUrl: string | null;
  backgroundUrl: string | null;
  backgroundVideoUrl: string | null;
}
interface PhotoRow { id: string; url: string }

type SectionContent = Record<string, unknown>;
interface EditorSection { type: string; included: boolean; content: SectionContent }

interface Props {
  event: EventData;
  invitation: InvitationData;
  /** Display name of the active theme (chosen in the Design step). */
  themeName: string;
  /**
   * Preset themes are design-locked: the Design tab (palette, typography,
   * per-section styling) is disabled and only content can change.
   */
  designLocked?: boolean;
  sectionRows: Array<{ type: string; content: unknown }>;
  initialPhotos: PhotoRow[];
  /** Resolved theme default colors/font for the gate, so the WYSIWYG editor's
   *  fallbacks match the live invite (not hardcoded gold). */
  themeDefaults: { accent: string; title: string; primary: string; muted: string; headingFont: string };
}

// ── Section defaults ─────────────────────────────────────────────────────────

const SECTION_META: Record<string, { label: string; icon: string }> = {
  cover:     { label: "Cover",          icon: "◈" },
  wording:   { label: "Wording",        icon: "✒" },
  countdown: { label: "Countdown",      icon: "⏱" },
  details:   { label: "Details / Venue", icon: "📋" },
  agenda:    { label: "Agenda",         icon: "🕐" },
  gallery:   { label: "Gallery",        icon: "🖼" },
  khqr:      { label: "KHQR Gift",      icon: "💳" },
  wishing:   { label: "Wishing Wall",   icon: "✨" },
  image:     { label: "Image",          icon: "🏞" },
};

/** Per-section text-box fine-tuning (rendered by DbThemeSections `styled()`). */
type TextAlignOpt = "left" | "center" | "right";
interface SectionStyleOverride {
  titleFont?: string; titleColor?: string; titleScale?: number; titleWeight?: number; titleAlign?: TextAlignOpt;
  bodyFont?: string;  bodyColor?: string;  bodyScale?: number;  bodyWeight?: number;  bodyAlign?: TextAlignOpt;
}

const SECTION_EFFECTS: Array<{ id: SectionEffect; label: string }> = [
  { id: "none", label: "None" },
  { id: "fade", label: "Fade in" },
  { id: "slide-up", label: "Slide up" },
  { id: "slide-down", label: "Slide down" },
  { id: "zoom", label: "Zoom in" },
];

const WEIGHT_OPTIONS: Array<{ v: number; l: string }> = [
  { v: 400, l: "Normal" }, { v: 500, l: "Medium" }, { v: 600, l: "Semibold" }, { v: 700, l: "Bold" }, { v: 800, l: "Extra bold" },
];

/** Font-weight dropdown + text-align button group, reused by every text style editor. */
function WeightAlignRow({ weight, onWeight, align, onAlign, weightDefault = 600 }: {
  weight?: number; onWeight: (v: number | undefined) => void;
  align?: TextAlignOpt; onAlign: (v: TextAlignOpt | undefined) => void;
  weightDefault?: number;
}) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
      <select className="eb-input" style={{ ...s.input, flex: "1 1 110px", minWidth: 110 }}
        value={weight ?? ""} onChange={(e) => onWeight(e.target.value ? +e.target.value : undefined)}>
        <option value="">Weight: theme ({weightDefault})</option>
        {WEIGHT_OPTIONS.map((w) => <option key={w.v} value={w.v}>{w.l} ({w.v})</option>)}
      </select>
      <div style={{ display: "flex", gap: "0.25rem" }}>
        {(["left", "center", "right"] as const).map((a) => (
          <button key={a} type="button" title={`Align ${a}`}
            style={{ ...s.smallBtn, ...(align === a ? s.smallBtnOn : {}) }}
            onClick={() => onAlign(align === a ? undefined : a)}>
            {a === "left" ? "⯇" : a === "right" ? "⯈" : "◆"}
          </button>
        ))}
      </div>
    </div>
  );
}

type TextFit = "wrap" | "shrink";

/** Wrap vs. shrink-to-fit toggle for long text — used wherever content length
 *  varies at runtime (guest names) or can simply run long (badges). */
function TextFitRow({ value, onChange }: { value: TextFit; onChange: (v: TextFit) => void }) {
  return (
    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.72rem", color: "var(--c-muted)" }}>Long text:</span>
      {(["wrap", "shrink"] as const).map((f) => (
        <button key={f} type="button"
          style={{ ...s.smallBtn, ...(value === f ? s.smallBtnOn : {}) }}
          onClick={() => onChange(f)}>
          {f === "wrap" ? "Wrap to new line" : "Shrink to fit"}
        </button>
      ))}
    </div>
  );
}

const DEFAULT_SECTIONS: EditorSection[] = [
  { type: "cover",     included: true,  content: {} },
  { type: "wording",   included: false, content: { title: "", text: "" } },
  { type: "countdown", included: false, content: { targetDate: "", label: "" } },
  { type: "details",   included: false, content: { items: [] } },
  { type: "agenda",    included: false, content: { items: [] } },
  { type: "gallery",   included: false, content: { layout: "grid" } },
  { type: "khqr",      included: false, content: {} },
  { type: "wishing",   included: false, content: {} },
];

function initSections(defaultSections: unknown, rows: Array<{ type: string; content: unknown }>): EditorSection[] {
  let base: EditorSection[] = [];
  if (Array.isArray(defaultSections) && defaultSections.length > 0 && typeof defaultSections[0] === "object") {
    base = (defaultSections as EditorSection[]).map((s) => ({
      type: s.type,
      included: !!s.included,
      content: (s.content ?? {}) as SectionContent,
    }));
  } else if (rows.length > 0) {
    base = rows.map((r) => ({ type: r.type, included: true, content: (r.content ?? {}) as SectionContent }));
  }
  // Append any known section types that aren't present yet (as excluded).
  for (const d of DEFAULT_SECTIONS) {
    if (!base.some((s) => s.type === d.type)) base.push({ ...d, content: { ...d.content } });
  }
  return base;
}

// ── Small form atoms ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={s.field}>
      <span style={s.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

/** "Hide title" checkbox — most bespoke theme renderers read `content.hideTitle`
 *  to suppress the section heading, but had no admin control until now. */
function HideTitleCheck({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={s.checkRow}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      Hide section title
    </label>
  );
}

function Txt({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={s.input} />;
}

function Area({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return <textarea value={value} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)} style={{ ...s.input, resize: "vertical" as const }} />;
}

/** Image URL field with upload → /api/admin/upload (Cloudinary). */
function ImgField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "themes");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) onChange(data.url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 6, border: "1px solid var(--c-border)" }} />
      ) : (
        <div style={{ width: 42, height: 42, borderRadius: 6, border: "1px dashed var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-muted)", fontSize: "0.7rem" }}>—</div>
      )}
      <button type="button" style={s.smallBtn} disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? "Uploading…" : value ? "Replace" : "Upload"}
      </button>
      {value && <button type="button" style={s.smallGhost} onClick={() => onChange("")}>✕</button>}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  );
}

// ── Per-section text-style fine-tuning (font / color / size per text box) ────

function TextStylePanel({ value, onChange, titleSample, bodySample, effectValue, onEffectChange }: {
  value: SectionStyleOverride;
  onChange: (next: SectionStyleOverride) => void;
  /** Real content shown in the font previews so they match the live text. */
  titleSample?: string;
  bodySample?: string;
  /** This section's entrance-effect override; undefined = follow the invite's default. */
  effectValue?: SectionEffect;
  onEffectChange?: (v: SectionEffect | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<SectionStyleOverride>) => onChange({ ...value, ...patch });
  const active = Object.values(value).some((v) => v !== undefined && v !== "" && v !== 1) || !!effectValue;

  return (
    <div style={{ border: "1px dashed var(--c-border)", borderRadius: 8, padding: "0.5rem 0.6rem" }}>
      <button type="button" style={s.secToggleBtn} onClick={() => setOpen(!open)}>
        <span>🖋</span>
        <span style={{ fontWeight: 600 }}>Text style{active ? " · customized" : ""}</span>
        <span style={{ marginLeft: "auto", color: "var(--c-muted)" }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginTop: "0.5rem" }}>
          <Field label="Title font">
            <FontPicker value={value.titleFont ?? ""} onChange={(v) => set({ titleFont: v || undefined })} options={HEADING_FONTS} previewText={titleSample || undefined} />
          </Field>
          <Field label="Title color">
            <ColorField value={value.titleColor ?? ""} onChange={(v) => set({ titleColor: v || undefined })} />
          </Field>
          <Field label="Title size">
            <SizeField value={value.titleScale ?? 1} onChange={(v) => set({ titleScale: v === 1 ? undefined : v })} />
          </Field>
          <Field label="Title weight · align">
            <WeightAlignRow weight={value.titleWeight} onWeight={(v) => set({ titleWeight: v })}
              align={value.titleAlign} onAlign={(v) => set({ titleAlign: v })} weightDefault={600} />
          </Field>
          <Field label="Body font">
            <FontPicker value={value.bodyFont ?? ""} onChange={(v) => set({ bodyFont: v || undefined })} options={BODY_FONTS} previewText={bodySample || undefined} />
          </Field>
          <Field label="Body color">
            <ColorField value={value.bodyColor ?? ""} onChange={(v) => set({ bodyColor: v || undefined })} />
          </Field>
          <Field label="Body size">
            <SizeField value={value.bodyScale ?? 1} onChange={(v) => set({ bodyScale: v === 1 ? undefined : v })} />
          </Field>
          <Field label="Body weight · align">
            <WeightAlignRow weight={value.bodyWeight} onWeight={(v) => set({ bodyWeight: v })}
              align={value.bodyAlign} onAlign={(v) => set({ bodyAlign: v })} weightDefault={400} />
          </Field>
          {onEffectChange && (
            <Field label="Entrance effect">
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                <button type="button" style={{ ...s.smallBtn, ...(!effectValue ? s.smallBtnOn : {}) }}
                  onClick={() => onEffectChange(undefined)}>Follow invite</button>
                {SECTION_EFFECTS.map((eff) => (
                  <button key={eff.id} type="button"
                    style={{ ...s.smallBtn, ...(effectValue === eff.id ? s.smallBtnOn : {}) }}
                    onClick={() => onEffectChange(eff.id)}>
                    {eff.label}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>
      )}
    </div>
  );
}

/** Image / GIF / motion-video field for backgrounds → /api/admin/upload. */
function MediaField({ value, onChange }: { value: string; onChange: (url: string, isVideo: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(value);

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "backgrounds");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        const video = file.type.startsWith("video/") || /\.(mp4|webm|mov)(\?|$)/i.test(data.url);
        onChange(data.url, video);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
      {value ? (
        isVideo ? (
          <video src={value} muted style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 6, border: "1px solid var(--c-border)" }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 6, border: "1px solid var(--c-border)" }} />
        )
      ) : (
        <div style={{ width: 42, height: 42, borderRadius: 6, border: "1px dashed var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-muted)", fontSize: "0.7rem" }}>—</div>
      )}
      <button type="button" style={s.smallBtn} disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? "Uploading…" : value ? "Replace" : "Upload"}
      </button>
      {value && <button type="button" style={s.smallGhost} onClick={() => onChange("", false)}>✕</button>}
      <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
    </div>
  );
}

// ── Opening-gate free-drag layout editor ─────────────────────────────────────

const GATE_ELEMENTS: Array<{ key: GateElementKey; label: string }> = [
  { key: "monogram",  label: "Monogram" },
  { key: "pretitle",  label: "Greeting" },
  { key: "title",     label: "Names" },
  { key: "subtitle",  label: "Intro lines" },
  { key: "guestName", label: "Guest name" },
  { key: "openBtn",   label: "Open button" },
];

type GatePlace = { xPct: number; yPct: number; scale?: number; color?: string; font?: string; weight?: number; align?: TextAlignOpt };

interface GateWysiwygData {
  title: string; greeting: string; subheading: string; guestLabel: string;
  bgUrl: string; monogramUrl: string; showMonogram: boolean; showGuestName: boolean;
  accent: string; primary: string; muted: string; headingFont: string;
  gateBg: string;
  /** Prefix badge above the guest name (default "Dear"), and its own styling. */
  guestPrefix?: string;
  guestPrefixColor?: string; guestPrefixFont?: string; guestPrefixSize?: number; guestPrefixWeight?: number; guestPrefixFit?: TextFit;
  guestNameFit?: TextFit;
  /** Open-button colors/label/font/size so the preview mirrors the live gate. */
  openBtnColor?: string; openBtnStroke?: string; openBtnFill?: string; openBtnText?: string;
  openBtnFont?: string; openBtnSize?: number; openBtnWeight?: number;
  openBtnStrokeEnabled?: boolean; openBtnFillEnabled?: boolean; openBtnFit?: TextFit;
  /** Wrap/shrink behavior for the greeting, names and intro-lines text. */
  pretitleFit?: TextFit; titleFit?: TextFit; subheadingFit?: TextFit;
}

/** Canva/Photoshop-style transform box — a measured outline around the active
 *  element with 8 corner/edge handles, all driving the same uniform resize. */
function GateTransformBox({ boxRef, targetEl, onHandleDown }: {
  boxRef: React.RefObject<HTMLDivElement>;
  targetEl: HTMLElement | null;
  onHandleDown: (e: React.PointerEvent) => void;
}) {
  const [box, setBox] = useState<{ l: number; t: number; w: number; h: number } | null>(null);
  useEffect(() => {
    if (!targetEl || !boxRef.current) { setBox(null); return; }
    const measure = () => {
      if (!boxRef.current) return;
      const cr = boxRef.current.getBoundingClientRect();
      const ir = targetEl.getBoundingClientRect();
      setBox({
        l: (ir.left - cr.left) / cr.width * 100,
        t: (ir.top - cr.top) / cr.height * 100,
        w: ir.width / cr.width * 100,
        h: ir.height / cr.height * 100,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(targetEl);
    return () => ro.disconnect();
  }, [targetEl, boxRef]);
  if (!box) return null;
  const { l, t, w, h } = box;
  const pad = 3; // small margin so the box clears the text/glyphs, like Canva's selection outline
  const L = l - pad, T = t - pad, W = w + pad * 2, H = h + pad * 2;
  const handles = [
    { x: L,         y: T,         cur: "nw-resize" },
    { x: L + W / 2, y: T,         cur: "n-resize"  },
    { x: L + W,     y: T,         cur: "ne-resize" },
    { x: L + W,     y: T + H / 2, cur: "e-resize"  },
    { x: L + W,     y: T + H,     cur: "se-resize" },
    { x: L + W / 2, y: T + H,     cur: "s-resize"  },
    { x: L,         y: T + H,     cur: "sw-resize" },
    { x: L,         y: T + H / 2, cur: "w-resize"  },
  ];
  return (
    <>
      <div style={{
        position: "absolute", left: `${L}%`, top: `${T}%`, width: `${W}%`, height: `${H}%`,
        border: "1.5px solid var(--c-accent)", borderRadius: 3, pointerEvents: "none", zIndex: 9,
      }} />
      {handles.map((c, i) => (
        <div key={i}
          style={{
            position: "absolute", left: `${c.x}%`, top: `${c.y}%`, width: 9, height: 9,
            marginLeft: -4.5, marginTop: -4.5, background: "#fff", border: "1.5px solid var(--c-accent)",
            borderRadius: 2, cursor: c.cur, touchAction: "none", zIndex: 11,
          }}
          onPointerDown={onHandleDown}
        />
      ))}
    </>
  );
}

/** WYSIWYG opening-gate editor — drag & resize the REAL cover elements on a
 *  true-to-life portrait preview (real background, fonts, colors and text). */
function GateWysiwygEditor({ positions, onChange, data }: {
  positions: Partial<Record<GateElementKey, GatePlace>>;
  onChange: (next: Partial<Record<GateElementKey, GatePlace>>) => void;
  data: GateWysiwygData;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const elRefs = useRef<Map<GateElementKey, HTMLDivElement>>(new Map());
  const drag = useRef<{ key: GateElementKey; mode: "move" | "resize"; startScale: number; cx: number; cy: number; startDist: number; moved: boolean } | null>(null);
  const [active, setActive] = useState<GateElementKey | null>(null);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const place = (key: GateElementKey): GatePlace => positions[key] ?? GATE_DEFAULT_POSITIONS[key];

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !boxRef.current) return;
    d.moved = true;
    const r = boxRef.current.getBoundingClientRect();
    if (d.mode === "move") {
      const xPct = clamp(((e.clientX - r.left) / r.width) * 100, 2, 98);
      const yPct = clamp(((e.clientY - r.top) / r.height) * 100, 2, 98);
      onChange({ ...positions, [d.key]: { ...place(d.key), xPct: Math.round(xPct), yPct: Math.round(yPct) } });
    } else {
      const dist = Math.hypot(e.clientX - d.cx, e.clientY - d.cy);
      const scale = clamp(+(d.startScale * (dist / (d.startDist || 1))).toFixed(2), 0.4, 3);
      onChange({ ...positions, [d.key]: { ...place(d.key), scale } });
    }
  };
  const startMove = (key: GateElementKey) => (e: React.PointerEvent) => {
    e.stopPropagation();
    setActive(key);
    drag.current = { key, mode: "move", startScale: place(key).scale ?? 1, cx: 0, cy: 0, startDist: 0, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const startResize = (key: GateElementKey) => (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const p = place(key);
    const cx = r.left + r.width * (p.xPct / 100);
    const cy = r.top + r.height * (p.yPct / 100);
    const startDist = Math.max(Math.hypot(e.clientX - cx, e.clientY - cy), 8);
    drag.current = { key, mode: "resize", startScale: p.scale ?? 1, cx, cy, startDist, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const end = () => { drag.current = null; };

  // Real content for each gate element, using the SAME rem sizes and style
  // formulas as the live gate (InviteGate.tsx) so this preview is pixel-accurate
  // once scaled down — not an ad hoc approximation.
  const content = (key: GateElementKey): React.ReactNode => {
    switch (key) {
      case "monogram":
        return data.showMonogram && data.monogramUrl
          ? <img src={data.monogramUrl} alt="" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 28px rgba(0,0,0,0.5)" }} />
          : null;
      case "pretitle":
        return (
          <span style={{
            color: place("pretitle").color || data.accent,
            fontFamily: place("pretitle").font || undefined,
            fontWeight: place("pretitle").weight || undefined,
            textAlign: place("pretitle").align || "center",
            fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", opacity: 0.75,
            ...(data.pretitleFit === "shrink" ? { whiteSpace: "nowrap" } : {}),
          }}>{data.greeting || "You are invited to"}</span>
        );
      case "title":
        return (
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <span style={{
              color: place("title").color || data.primary,
              fontFamily: place("title").font || "'Great Vibes', cursive",
              fontWeight: place("title").weight || undefined,
              fontSize: "3.4rem", lineHeight: 1.1, textAlign: place("title").align || "center",
              ...(data.titleFit === "shrink" ? { whiteSpace: "nowrap" } : {}),
            }}>{data.title || "Event title"}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 10, color: data.accent, width: "78%", maxWidth: 320 }}>
              <span style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.25 }} />
              <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>◆</span>
              <span style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.25 }} />
            </span>
          </span>
        );
      case "subtitle":
        return data.subheading
          ? (
            <span style={{
              color: place("subtitle").color || data.muted,
              fontFamily: place("subtitle").font || undefined,
              fontWeight: place("subtitle").weight || undefined,
              fontSize: "0.7rem", fontStyle: "italic", letterSpacing: "0.04em", textTransform: "uppercase", opacity: 0.75,
              textAlign: place("subtitle").align || "center",
              ...(data.subheadingFit === "shrink" ? { whiteSpace: "nowrap" } : {}),
            }}>{data.subheading}</span>
          )
          : null;
      case "guestName":
        return data.showGuestName ? (
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{
              color: data.guestPrefixColor || data.accent,
              border: `1px solid ${data.guestPrefixColor || data.accent}`,
              borderRadius: 999, padding: "0.3rem 0.9rem", opacity: 0.85,
              fontFamily: data.guestPrefixFont || undefined,
              fontSize: data.guestPrefixSize ? `${data.guestPrefixSize}px` : "0.62rem",
              fontWeight: data.guestPrefixWeight || undefined,
              letterSpacing: "0.18em", textTransform: "uppercase",
              whiteSpace: (data.guestPrefixFit ?? "wrap") === "wrap" ? "normal" : "nowrap",
            }}>♥ {data.guestPrefix || "Dear"}</span>
            <span style={{
              color: place("guestName").color || data.primary,
              fontFamily: place("guestName").font || data.headingFont,
              fontWeight: place("guestName").weight || undefined,
              textAlign: place("guestName").align || "center",
              fontSize: "1.4rem", lineHeight: 1.1,
              ...((data.guestNameFit ?? "wrap") === "shrink" ? { whiteSpace: "nowrap" } : {}),
            }}>{data.guestLabel || "Dear Guest"}</span>
          </span>
        ) : null;
      case "openBtn": {
        const oc = place("openBtn").color || data.openBtnColor || data.accent;
        const strokeOn = data.openBtnStrokeEnabled ?? true;
        const fillOn = data.openBtnFillEnabled ?? false;
        return (
          <span style={{
            color: oc,
            fontFamily: data.openBtnFont || place("openBtn").font || undefined,
            fontSize: data.openBtnSize ? `${data.openBtnSize}px` : "0.62rem",
            fontWeight: data.openBtnWeight || undefined,
            border: strokeOn ? `1px solid ${data.openBtnStroke || oc}` : "none",
            borderRadius: 999, padding: "0.4rem 1rem", letterSpacing: "0.2em", textTransform: "uppercase",
            background: fillOn && data.openBtnFill ? data.openBtnFill : "transparent",
            ...(data.openBtnFit === "shrink" ? { whiteSpace: "nowrap" } : {}),
          }}>
            {data.openBtnText || "Open Letter"}
          </span>
        );
      }
    }
  };

  // Design-space canvas matches a real phone width so the rem-based sizes
  // above render at their true relative proportions — then the whole thing
  // is scaled down uniformly to fit the small preview slot. This is what
  // keeps this WYSIWYG preview pixel-accurate to the live gate, instead of
  // each element needing its own hand-tuned "looks about right" font size.
  const DESIGN_W = 390;
  const BOX_W = 220;
  const BOX_H = Math.round(BOX_W * 17.5 / 9);
  const zoom = BOX_W / DESIGN_W;
  const DESIGN_H = Math.round(BOX_H / zoom);

  return (
    <>
      <div
        ref={boxRef}
        onPointerMove={move}
        onPointerUp={end}
        onPointerDown={() => setActive(null)}
        style={{
          position: "relative", width: BOX_W, height: BOX_H, margin: "0.4rem auto 0",
          borderRadius: 18, border: "1px solid var(--c-border)",
          background: data.bgUrl ? `#14161c url(${data.bgUrl}) center / cover no-repeat` : (data.gateBg || "linear-gradient(160deg, #2b2f3a, #14161c)"),
          overflow: "hidden", touchAction: "none", userSelect: "none",
        }}
      >
        {/* readability scrim, mirroring the live gate */}
        {data.bgUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />}

        <div style={{ position: "absolute", left: 0, top: 0, width: DESIGN_W, height: DESIGN_H, transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
          {GATE_ELEMENTS.map(({ key }) => {
            const node = content(key);
            if (!node) return null;
            const p = place(key);
            const scale = p.scale && p.scale > 0 ? p.scale : 1;
            const isActive = active === key;
            return (
              <div
                key={key}
                ref={(el) => { if (el) elRefs.current.set(key, el); else elRefs.current.delete(key); }}
                onPointerDown={startMove(key)}
                style={{
                  position: "absolute", left: `${p.xPct}%`, top: `${p.yPct}%`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "grab", padding: 2, borderRadius: 4,
                  outline: isActive ? "none" : "1px dashed rgba(255,255,255,0.25)",
                  outlineOffset: 2, zIndex: isActive ? 10 : 1,
                }}
              >
                {node}
              </div>
            );
          })}
        </div>
        {/* Canva/Photoshop-style transform box — corner + edge handles around the selected element */}
        {active && (
          <GateTransformBox boxRef={boxRef} targetEl={elRefs.current.get(active) ?? null} onHandleDown={startResize(active)} />
        )}
      </div>
      {active && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", fontSize: "0.72rem", color: "var(--c-muted)", textAlign: "center" }}>
            <span>Selected: <strong style={{ color: "var(--c-text)" }}>{GATE_ELEMENTS.find((g) => g.key === active)?.label ?? active}</strong> — edit its text, color &amp; font in the cards below.</span>
            {(place(active).scale ?? 1) !== 1 && (
              <button type="button" style={s.smallGhost} onClick={() => onChange({ ...positions, [active]: { ...place(active), scale: 1 } })}>Reset size</button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--c-muted)" }}>Snap to:</span>
            {([["Left", 15], ["Center", 50], ["Right", 85]] as const).map(([label, xPct]) => (
              <button key={label} type="button" style={s.smallGhost}
                onClick={() => onChange({ ...positions, [active]: { ...place(active), xPct } })}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Per-section content forms ────────────────────────────────────────────────

function SectionForm({ sec, onContent, locked, altLang }: {
  sec: EditorSection;
  onContent: (patch: SectionContent) => void;
  locked?: boolean;
  /** When true, text edits write to the secondary language (content.i18n). */
  altLang?: boolean;
}) {
  const [recentColors, recordRecentColor] = useRecentColors();
  // Bilingual editing: text fields read/write `content.i18n` for the secondary
  // language (base values show through until translated); media, mode and
  // style stay shared across languages.
  const base = sec.content;
  const i18n = (base.i18n ?? {}) as SectionContent;
  const c = altLang ? { ...base, ...i18n } : base;
  const onC = altLang
    ? (patch: SectionContent) => onContent({ i18n: { ...i18n, ...patch } })
    : onContent;
  const str = (k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");
  const set = (k: string) => (v: unknown) => onC({ [k]: v });
  /** Language-independent fields (uploads, URLs) always write to the base content. */
  const setBase = (k: string) => (v: unknown) => onContent({ [k]: v });
  const strBase = (k: string) => (typeof base[k] === "string" ? (base[k] as string) : "");

  const isImageMode = c.mode === "image";
  // Cover always shows its dedicated form; other sections can flip to image mode.
  const modeToggle = sec.type !== "cover" && (
    <div style={{ display: "flex", gap: "0.35rem" }}>
      {(["text", "image"] as const).map((m) => (
        <button key={m} type="button"
          style={{ ...s.smallBtn, ...(m === (isImageMode ? "image" : "text") ? { background: "var(--c-accent)", color: "var(--c-lime-text)", border: "1px solid var(--c-accent)" } : {}) }}
          onClick={() => onContent({ mode: m === "image" ? "image" : undefined })}>
          {m === "text" ? "✒ Text-based" : "🏞 Image-based"}
        </button>
      ))}
    </div>
  );

  // Image mode — the admin uploads the section's event information as an image.
  if (isImageMode && sec.type !== "cover") {
    return (
      <>
        {modeToggle}
        <Field label="Section image"><ImgField value={strBase("imageUrl")} onChange={setBase("imageUrl")} /></Field>
        <Field label="Title (optional)"><Txt value={str("title")} onChange={set("title")} /></Field>
        <Field label="Caption (optional)"><Txt value={str("caption")} onChange={set("caption")} /></Field>
        <p style={s.hint}>This section renders the uploaded image instead of text content.</p>
      </>
    );
  }

  const styleOverride = (c._style ?? {}) as SectionStyleOverride;
  const firstItem = (Array.isArray(c.items) && c.items[0] ? c.items[0] : {}) as { value?: string; title?: string };
  const titleSample = (typeof c.title === "string" && c.title) || (typeof c.heading === "string" && c.heading) || "";
  const bodySample =
    (typeof c.text === "string" && c.text) ||
    (typeof c.subheading === "string" && c.subheading) ||
    firstItem.value || firstItem.title || "";
  const effectOverride = (c._effect as { entrance?: SectionEffect } | undefined)?.entrance;
  const stylePanel = !locked && (
    <TextStylePanel value={styleOverride} onChange={(next) => onContent({ _style: next })}
      titleSample={titleSample} bodySample={bodySample}
      effectValue={effectOverride}
      onEffectChange={(v) => onContent({ _effect: v ? { entrance: v } : undefined })} />
  );

  const body = (() => {
  switch (sec.type) {
    case "cover":
      return (
        <>
          <Field label="Monogram / logo">
            <ImgField value={strBase("logoUrl")} onChange={setBase("logoUrl")} />
          </Field>
          <p style={s.hint}>Shown prominently on the opening gate and the cover section.</p>
          <Field label="Greeting line (above names)"><Txt value={str("greeting")} onChange={set("greeting")} placeholder="You are invited to" /></Field>
          <Field label="Names / heading"><Txt value={str("heading")} onChange={set("heading")} placeholder="Artem + Vika" /></Field>
          <p style={s.hint}>This is what guests see as the big title on the opening gate and cover. Leave blank to fall back to the event title.</p>
          <Field label="Intro lines"><Area value={str("subheading")} onChange={set("subheading")} rows={2} placeholder={"We invite you\nto our"} /></Field>
          <Field label="Big word"><Txt value={str("bigWord")} onChange={set("bigWord")} placeholder="wedding" /></Field>
          <Field label="Guest greeting label"><Txt value={str("guestLabel")} onChange={set("guestLabel")} placeholder="Dear" /></Field>
          <Field label="Cover photo"><ImgField value={strBase("imageUrl")} onChange={setBase("imageUrl")} /></Field>
          {stylePanel}
        </>
      );
    case "image":
      return (
        <>
          <Field label="Section image"><ImgField value={strBase("imageUrl")} onChange={setBase("imageUrl")} /></Field>
          <Field label="Title (optional)"><Txt value={str("title")} onChange={set("title")} /></Field>
          <Field label="Caption (optional)"><Txt value={str("caption")} onChange={set("caption")} /></Field>
        </>
      );
    case "wording":
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="Guess who?" /></Field>
          <Field label="Text"><Area value={str("text")} onChange={set("text")} rows={4} /></Field>
          <Field label="Photo (optional)"><ImgField value={strBase("imageUrl")} onChange={setBase("imageUrl")} /></Field>
          <label style={s.checkRow}>
            <input type="checkbox" checked={!!c.grayscale} onChange={(e) => onC({ grayscale: e.target.checked })} />
            Desaturate photo (black &amp; white) — themes that support this will apply it
          </label>
          <HideTitleCheck checked={!!c.hideTitle} onChange={(v) => onC({ hideTitle: v })} />
        </>
      );
    case "countdown": {
      const uc = (c.countdownColors ?? {}) as Record<string, string>;
      const setUc = (k: string, v: string) => onC({ countdownColors: { ...uc, [k]: v || undefined } });
      return (
        <>
          <Field label="Title"><Txt value={str("label")} onChange={set("label")} placeholder="When?" /></Field>
          <Field label="Target date & time">
            <Txt type="datetime-local" value={str("targetDate").slice(0, 16)} onChange={set("targetDate")} />
          </Field>
          <HideTitleCheck checked={!!c.hideTitle} onChange={(v) => onC({ hideTitle: v })} />
          <div style={s.subHead}>Number colors</div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {(["days", "hours", "minutes", "seconds"] as const).map((k) => (
              <label key={k} style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.7rem", color: "var(--c-muted)", textTransform: "capitalize" }}>
                {k}
                <ColorField value={uc[k] ?? ""} onChange={(v) => setUc(k, v)} />
              </label>
            ))}
          </div>
          <p style={s.hint}>Leave a unit blank to use the section&apos;s title color.</p>
        </>
      );
    }
    case "agenda": {
      const items = (Array.isArray(c.items) ? c.items : []) as Array<{ time?: string; title?: string; icon?: number; color?: string }>;
      const setItems = (next: typeof items) => onC({ items: next });
      const patchItem = (i: number, p: Partial<typeof items[number]>) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="What time?" /></Field>
          <HideTitleCheck checked={!!c.hideTitle} onChange={(v) => onC({ hideTitle: v })} />
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", border: "1px solid var(--c-border)", borderRadius: 8, padding: "0.5rem" }}>
              <div style={s.rowGroup}>
                <input type="time" value={it.time ?? ""} style={{ ...s.input, width: 116, flexShrink: 0 }}
                  onChange={(e) => patchItem(i, { time: e.target.value })} />
                <input value={it.title ?? ""} placeholder="Ceremony" style={s.input}
                  onChange={(e) => patchItem(i, { title: e.target.value })} />
                <button type="button" style={s.smallGhost} onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</button>
              </div>
              <div>
                <div style={{ ...s.fieldLabel, marginBottom: 3 }}>Activity icon</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                  <button type="button" title="No icon" onClick={() => patchItem(i, { icon: undefined })}
                    style={{ ...s.iconChoice, ...(it.icon ? {} : s.iconChoiceOn), fontSize: "0.65rem" }}>none</button>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button key={n} type="button" title={`Icon ${n}`} onClick={() => patchItem(i, { icon: n })}
                      style={{ ...s.iconChoice, ...(it.icon === n ? s.iconChoiceOn : {}) }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/themes/agenda/${n}.png`} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                    </button>
                  ))}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", color: "var(--c-muted)" }}>
                Row color
                <ColorField value={it.color ?? ""} onChange={(v) => patchItem(i, { color: v || undefined })} />
              </label>
            </div>
          ))}
          <button type="button" style={s.smallBtn} onClick={() => setItems([...items, { time: "", title: "", icon: undefined }])}>+ Add moment</button>
          <Field label="Note (optional)"><Area value={str("note")} onChange={set("note")} rows={2} placeholder="* Kindly arrive 15 minutes early" /></Field>
        </>
      );
    }
    case "details": {
      const items = (Array.isArray(c.items) ? c.items : []) as Array<{ icon?: string; label?: string; value?: string }>;
      const dress = (Array.isArray(c.dresscode) ? c.dresscode : []) as string[];
      const notes = (Array.isArray(c.notes) ? c.notes : []) as string[];
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="Where?" /></Field>
          <HideTitleCheck checked={!!c.hideTitle} onChange={(v) => onC({ hideTitle: v })} />
          {items.map((it, i) => (
            <div key={i} style={s.rowGroup}>
              <input value={it.label ?? ""} placeholder="Address" style={{ ...s.input, width: 92, flexShrink: 0 }}
                onChange={(e) => onC({ items: items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input value={it.value ?? ""} placeholder="Lesnoy Lane 4…" style={s.input}
                onChange={(e) => onC({ items: items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <button type="button" style={s.smallGhost} onClick={() => onC({ items: items.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button type="button" style={s.smallBtn} onClick={() => onC({ items: [...items, { icon: "📍", label: "", value: "" }] })}>+ Add row</button>
          <Field label="Venue photo"><ImgField value={strBase("imageUrl")} onChange={setBase("imageUrl")} /></Field>
          <label style={s.checkRow}>
            <input type="checkbox" checked={!!c.grayscale} onChange={(e) => onC({ grayscale: e.target.checked })} />
            Desaturate photo (black &amp; white) — themes that support this will apply it
          </label>
          <Field label="Map URL (optional — overrides the event's venue map link)"><Txt value={str("mapUrl")} onChange={set("mapUrl")} placeholder="https://maps.google.com/…" /></Field>
          <Field label="Map button label"><Txt value={str("mapLabel")} onChange={set("mapLabel")} placeholder="open map" /></Field>

          <div style={s.subHead}>Dress code</div>
          <Field label="Section label"><Txt value={str("dresscodeLabel")} onChange={set("dresscodeLabel")} placeholder="Dress code" /></Field>
          <Field label="Text"><Area value={str("dresscodeText")} onChange={set("dresscodeText")} rows={2} /></Field>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
            {dress.map((col, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                <input type="color" value={col} style={s.colorInput}
                  onChange={(e) => { onContent({ dresscode: dress.map((x, j) => (j === i ? e.target.value : x)) }); recordRecentColor(e.target.value); }} />
                <button type="button" style={s.tinyGhost} onClick={() => onContent({ dresscode: dress.filter((_, j) => j !== i) })}>✕</button>
              </span>
            ))}
            <button type="button" style={s.smallBtn} onClick={() => onContent({ dresscode: [...dress, "#e75480"] })}>+ Color</button>
            {/* dress-code colors are shared across both languages */}
          </div>
          <RecentColorSwatches recent={recentColors} onPick={(c) => { onContent({ dresscode: [...dress, c] }); recordRecentColor(c); }} size={16} />

          <div style={s.subHead}>Notes</div>
          <Field label="Section label"><Txt value={str("notesLabel")} onChange={set("notesLabel")} placeholder="Notes" /></Field>
          {notes.map((n, i) => (
            <div key={i} style={s.rowGroup}>
              <textarea value={n} rows={2} style={{ ...s.input, resize: "vertical" as const }}
                onChange={(e) => onC({ notes: notes.map((x, j) => (j === i ? e.target.value : x)) })} />
              <button type="button" style={s.smallGhost} onClick={() => onC({ notes: notes.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button type="button" style={s.smallBtn} onClick={() => onC({ notes: [...notes, ""] })}>+ Add note</button>
        </>
      );
    }
    case "gallery":
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="Our moments" /></Field>
          <label style={s.checkRow}>
            <input type="checkbox" checked={!!c.grayscale} onChange={(e) => onC({ grayscale: e.target.checked })} />
            Desaturate photos (black &amp; white) — themes that support this will apply it
          </label>
          <HideTitleCheck checked={!!c.hideTitle} onChange={(v) => onC({ hideTitle: v })} />
        </>
      );
    case "khqr":
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="A gift from the heart" /></Field>
          <Field label="Recipient"><Txt value={str("recipientName")} onChange={set("recipientName")} /></Field>
          <Field label="QR image"><ImgField value={strBase("qrImageUrl")} onChange={setBase("qrImageUrl")} /></Field>
          <HideTitleCheck checked={!!c.hideTitle} onChange={(v) => onC({ hideTitle: v })} />
        </>
      );
    case "wishing":
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="Wishing wall" /></Field>
          <Field label="Input placeholder"><Txt value={str("placeholder")} onChange={set("placeholder")} /></Field>
          <HideTitleCheck checked={!!c.hideTitle} onChange={(v) => onC({ hideTitle: v })} />
        </>
      );
    default:
      return <p style={{ fontSize: "0.8rem", color: "var(--c-muted)", margin: 0 }}>No editor for “{sec.type}” yet.</p>;
  }
  })();

  return (
    <>
      {modeToggle}
      {body}
      {sec.type !== "cover" && sec.type !== "image" && stylePanel}
    </>
  );
}

// ── Color override keys ──────────────────────────────────────────────────────

/** Set a palette key, or remove it entirely when cleared (theme default). */
function setOrClear(c: Record<string, string>, key: string, v: string): Record<string, string> {
  const next = { ...c };
  if (v) next[key] = v;
  else delete next[key];
  return next;
}

const COLOR_KEYS: Array<{ key: string; label: string }> = [
  { key: "title",  label: "Titles" },
  { key: "header", label: "Headers" },
  { key: "body",   label: "Body text" },
  { key: "accent", label: "Accent" },
  { key: "text",   label: "Base text" },
  { key: "muted",  label: "Muted" },
];

// ── Main component ───────────────────────────────────────────────────────────

type Step = "basics" | "cover" | "sections" | "buttons" | "guide";

export function ThemeEditor({ event, invitation, themeName, designLocked = false, sectionRows, initialPhotos, themeDefaults }: Props) {
  const oc = invitation.overlayConfig ?? {};

  const [step, setStep] = useState<Step>("basics");
  const [colors, setColors]     = useState<Record<string, string>>((oc.colorScheme as Record<string, string>) ?? {});
  const [coverUrl, setCoverUrl] = useState(invitation.coverUrl ?? "");
  const [basics, setBasics] = useState({
    title: event.title,
    eventDate: event.eventDate.slice(0, 16),
    venueName: event.venueName ?? "",
    venueMapUrl: event.venueMapUrl ?? "",
  });
  // Theme font scheme — Title / Header / Body style + size (setup stage).
  const ocFonts = (oc.fonts ?? {}) as { heading?: string; header?: string; body?: string; headingScale?: number; bodyScale?: number };
  const [fonts, setFonts] = useState({
    heading: ocFonts.heading ?? "",
    header: ocFonts.header ?? "",
    body: ocFonts.body ?? "",
    headingScale: ocFonts.headingScale ?? 1,
    bodyScale: ocFonts.bodyScale ?? 1,
  });
  // Floating action buttons config.
  const ocFab = (oc.floatButtons ?? {}) as Partial<DesignFloatButtons>;
  const [fab, setFab] = useState<DesignFloatButtons>({
    ...DEFAULT_FLOAT_BUTTONS,
    ...ocFab,
    show: { ...DEFAULT_FLOAT_BUTTONS.show, ...(ocFab.show ?? {}) },
  });
  // Floating-button colors — null follows the theme's own action-button colors.
  const [actionButton, setActionButton] = useState<{ bg: string; color: string } | null>(
    (oc.actionButton as { bg: string; color: string } | undefined) ?? null
  );
  // Monogram placement + guidance overlay.
  const ocMono = (oc.monogram ?? { gate: true, sections: false }) as { gate: boolean; sections: boolean };
  const [monogram, setMonogram] = useState(ocMono);
  const [guide, setGuide] = useState({
    enabled: (oc.scrollGuide as boolean | undefined) ?? true,
    text: (oc.guideText as string | undefined) ?? "Scroll to explore",
  });
  // Hand icon for the gate open button + guidance overlay.
  const [guideHand, setGuideHand] = useState<{ kind: "default" | "emoji" | "image"; value: string }>(
    (oc.guideHand as { kind: "default" | "emoji" | "image"; value: string } | undefined) ?? { kind: "default", value: "" }
  );
  // Backgrounds — media (image/GIF/video), plain colors, blur amounts.
  const [bg, setBg] = useState({
    image: invitation.backgroundUrl ?? "",
    video: invitation.backgroundVideoUrl ?? "",
    pageColor: (oc.pageBgColor as string | undefined) ?? "",
    gateColor: (oc.gateBgColor as string | undefined) ?? "",
    coverBlur: (oc.backgroundBlur as number | undefined) ?? 0,
    sectionBlur: (oc.sectionBlur as number | undefined) ?? 0,
  });
  // Desktop-only backdrop shown around the portrait invite on wide screens —
  // distinct from the Sections background above, which is scoped to the portrait.
  const [outerBg, setOuterBg] = useState({
    url: (oc.outerBgUrl as string | undefined) ?? "",
    color: (oc.outerBgColor as string | undefined) ?? "",
  });
  // Adjustable dim over the sections background (the tint over the wallpaper).
  const ocOverlay = (oc.sectionOverlay ?? { enabled: true, color: "#000000", opacity: 0.28 }) as { enabled: boolean; color: string; opacity: number };
  const [sectionOverlay, setSectionOverlay] = useState(ocOverlay);
  // Default entrance transition each section plays once as it scrolls into view.
  const [sectionEffect, setSectionEffect] = useState<SectionEffect>((oc.sectionEffect as SectionEffect | undefined) ?? "none");
  // Guest-name decorative frame + free-drag gate layout (monogram/heading/etc.).
  const [showGuestName, setShowGuestName] = useState((oc.showGuestName as boolean | undefined) ?? true);
  const [guestFrameUrl, setGuestFrameUrl] = useState((oc.guestFrameUrl as string | undefined) ?? "");
  const [elementPositions, setElementPositions] = useState<Partial<Record<GateElementKey, GatePlace>>>(
    (oc.elementPositions as Partial<Record<GateElementKey, GatePlace>> | undefined) ?? {}
  );
  // Opening behaviour — entrance animation on/off, keep cover after opening,
  // and the "Open" button color.
  const [coverOpts, setCoverOpts] = useState({
    animateOpen: (oc.animateOpen as boolean | undefined) ?? true,
    keepCoverAfterOpen: (oc.keepCoverAfterOpen as boolean | undefined) ?? true,
    openOnScroll: (oc.openOnScroll as boolean | undefined) ?? false,
    openButtonColor: (oc.openButtonColor as string | undefined) ?? "",
    openButtonStroke: (oc.openButtonStroke as string | undefined) ?? "",
    openButtonFill: (oc.openButtonFill as string | undefined) ?? "",
    openButtonText: (oc.openButtonText as string | undefined) ?? "",
    openButtonFont: (oc.openButtonFont as string | undefined) ?? "",
    openButtonSize: (oc.openButtonSize as number | undefined) ?? 10,
    openButtonWeight: (oc.openButtonWeight as number | undefined) ?? undefined,
    openButtonStrokeEnabled: (oc.openButtonStrokeEnabled as boolean | undefined) ?? true,
    openButtonFillEnabled: (oc.openButtonFillEnabled as boolean | undefined) ?? false,
    guestPrefix: (oc.guestPrefix as string | undefined) ?? "",
    guestPrefixColor: (oc.guestPrefixColor as string | undefined) ?? "",
    guestPrefixFont: (oc.guestPrefixFont as string | undefined) ?? "",
    guestPrefixSize: (oc.guestPrefixSize as number | undefined) ?? 10,
    guestPrefixWeight: (oc.guestPrefixWeight as number | undefined) ?? undefined,
    guestPrefixFit: (oc.guestPrefixFit as "wrap" | "shrink" | undefined) ?? "wrap",
    guestNameFit: (oc.guestNameFit as "wrap" | "shrink" | undefined) ?? "wrap",
    pretitleFit: (oc.pretitleFit as "wrap" | "shrink" | undefined) ?? "wrap",
    titleFit: (oc.titleFit as "wrap" | "shrink" | undefined) ?? "wrap",
    subheadingFit: (oc.subheadingFit as "wrap" | "shrink" | undefined) ?? "wrap",
    openButtonFit: (oc.openButtonFit as "wrap" | "shrink" | undefined) ?? "wrap",
  });
  // Adjustable dim over the cover/gate background (mirrors sectionOverlay).
  const ocGateOverlay = (oc.gateOverlay ?? { enabled: false, color: "#000000", opacity: 0.45 }) as { enabled: boolean; color: string; opacity: number };
  const [gateOverlay, setGateOverlay] = useState(ocGateOverlay);
  // Bilingual content.
  const ocLangs = (oc.languages ?? {}) as { enabled?: boolean; primaryLabel?: string; secondaryLabel?: string };
  const [languages, setLanguages] = useState({
    enabled: ocLangs.enabled ?? false,
    primaryLabel: ocLangs.primaryLabel ?? "ខ្មែរ",
    secondaryLabel: ocLangs.secondaryLabel ?? "EN",
  });
  const [editLang, setEditLang] = useState<"primary" | "secondary">("primary");
  const [sections, setSections] = useState<EditorSection[]>(() => initSections(invitation.defaultSections, sectionRows));
  const hasLogo = !!((sections.find((x) => x.type === "cover")?.content as { logoUrl?: string } | undefined)?.logoUrl);
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [open, setOpen] = useState<string | null>("cover0");
  // The section type currently open — drives the live preview's focus.
  const [openType, setOpenType] = useState<string | null>("cover");
  const firstFocus = useRef(true);
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");

  // ── Double-buffered live preview ───────────────────────────────────────────
  // Two iframes; only the "front" one is visible. A reload loads the new URL
  // into the hidden "back" iframe and swaps once it has painted, so the preview
  // never blanks to black while the fresh content loads.
  const [srcs, setSrcs] = useState<[string, string]>(() => [
    `/invite/${event.slug}?preview=1&v=0`,
    "about:blank",
  ]);
  const [front, setFront] = useState(0);
  const frontRef = useRef(0);
  const openTypeRef = useRef(openType);
  const reloadN = useRef(0);
  const pendingBack = useRef<number | null>(null);
  const frameRefs = useRef<Array<HTMLIFrameElement | null>>([null, null]);
  frontRef.current = front;
  openTypeRef.current = openType;

  const buildPreviewSrc = (n: number) => {
    const ot = openTypeRef.current;
    const focus = ot && ot !== "cover" ? `&focus=${ot}` : "";
    return `/invite/${event.slug}?preview=1&v=${n}${focus}`;
  };
  // Stable across renders (assigned every render so it always sees fresh refs).
  const reloadRef = useRef<() => void>(() => {});
  reloadRef.current = () => {
    const back = 1 - frontRef.current;
    reloadN.current += 1;
    pendingBack.current = back;
    setSrcs((arr) => {
      const next = [...arr] as [string, string];
      next[back] = buildPreviewSrc(reloadN.current);
      return next;
    });
  };
  const onFrameLoad = (i: number) => {
    if (pendingBack.current === i) {
      pendingBack.current = null;
      frontRef.current = i;
      setFront(i);
    }
  };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);
  const firstRunSections = useRef(true);
  // Set whenever anything OTHER than section content changes (colors, fonts,
  // background, cover options, …) — those still need a real reload to preview,
  // since only section content is live-patched into the running iframe.
  const nonTextDirtyRef = useRef(false);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const [galleryBusy, setGalleryBusy] = useState(false);

  // ── Autosave: any edit → debounce → PATCH → reload preview ────────────────
  // The theme id passes through untouched — changing it is the Design step's job.
  const save = useCallback(async () => {
    setStatus("saving");
    const overlayConfig: Record<string, unknown> = {
      ...oc,
      colorScheme: colors,
      fonts: {
        heading: fonts.heading || undefined,
        header: fonts.header || undefined,
        body: fonts.body || undefined,
        headingScale: fonts.headingScale,
        bodyScale: fonts.bodyScale,
      },
      floatButtons: fab,
      actionButton: actionButton ?? undefined,
      animateOpen: coverOpts.animateOpen,
      keepCoverAfterOpen: coverOpts.keepCoverAfterOpen,
      openOnScroll: coverOpts.openOnScroll,
      openButtonColor: coverOpts.openButtonColor || null,
      openButtonStroke: coverOpts.openButtonStroke || null,
      openButtonFill: coverOpts.openButtonFill || null,
      openButtonText: coverOpts.openButtonText || null,
      openButtonFont: coverOpts.openButtonFont || null,
      openButtonSize: coverOpts.openButtonSize || null,
      openButtonWeight: coverOpts.openButtonWeight || null,
      openButtonStrokeEnabled: coverOpts.openButtonStrokeEnabled,
      openButtonFillEnabled: coverOpts.openButtonFillEnabled,
      openButtonFit: coverOpts.openButtonFit,
      pretitleFit: coverOpts.pretitleFit,
      titleFit: coverOpts.titleFit,
      subheadingFit: coverOpts.subheadingFit,
      gateOverlay,
      monogram,
      scrollGuide: guide.enabled,
      guideText: guide.text,
      guideHand,
      gateBgColor: bg.gateColor || null,
      pageBgColor: bg.pageColor || null,
      backgroundBlur: bg.coverBlur,
      sectionBlur: bg.sectionBlur,
      outerBgUrl: outerBg.url || null,
      outerBgColor: outerBg.color || null,
      sectionOverlay,
      sectionEffect,
      showGuestName,
      guestFrameUrl: guestFrameUrl || null,
      guestPrefix: coverOpts.guestPrefix || null,
      guestPrefixColor: coverOpts.guestPrefixColor || null,
      guestPrefixFont: coverOpts.guestPrefixFont || null,
      guestPrefixSize: coverOpts.guestPrefixSize || null,
      guestPrefixWeight: coverOpts.guestPrefixWeight || null,
      guestPrefixFit: coverOpts.guestPrefixFit,
      guestNameFit: coverOpts.guestNameFit,
      elementPositions: Object.keys(elementPositions).length > 0 ? elementPositions : undefined,
      languages,
    };
    if (Object.keys(colors).length === 0) delete overlayConfig.colorScheme;
    if (!actionButton) delete overlayConfig.actionButton;
    if (!overlayConfig.elementPositions) delete overlayConfig.elementPositions;

    const res = await fetch(`/api/admin/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: basics.title,
        eventDate: basics.eventDate,
        venueName: basics.venueName || null,
        venueMapUrl: basics.venueMapUrl || null,
        defaultSections: sections,
        overlayConfig,
        coverUrl: coverUrl || null,
        backgroundUrl: bg.image || null,
        backgroundVideoUrl: bg.video || null,
      }),
    }).catch(() => null);

    if (res?.ok) {
      setStatus("saved");
      // Section content is already live in the preview (see the postMessage
      // effect below) — only reload when something a live-patch can't reach
      // (colors, fonts, background, cover options, …) actually changed.
      if (nonTextDirtyRef.current) {
        nonTextDirtyRef.current = false;
        reloadRef.current(); // reload the live preview (double-buffered, no blackout)
      }
    } else {
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basics, sections, colors, coverUrl, fonts, fab, actionButton, monogram, guide, guideHand, bg, outerBg, sectionOverlay, sectionEffect, gateOverlay, showGuestName, guestFrameUrl, elementPositions, languages, coverOpts, event.id]);

  // `save` is recreated whenever `sections` changes (it's a dependency), so it
  // can't sit in the "non-text" effect's deps below without that effect firing
  // on every keystroke too. Call through a ref that's always current instead.
  const saveRef = useRef(save);
  saveRef.current = save;

  // Section content edits: debounce-save for persistence, but the preview
  // already updated instantly via postMessage — no reload needed here.
  useEffect(() => {
    if (firstRunSections.current) { firstRunSections.current = false; return; }
    setStatus("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveRef.current(), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [sections]);

  // Everything else still requires a real reload to preview.
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    nonTextDirtyRef.current = true;
    setStatus("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveRef.current(), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [basics, colors, coverUrl, fonts, fab, actionButton, monogram, guide, guideHand, bg, outerBg, sectionEffect, showGuestName, guestFrameUrl, elementPositions, languages, coverOpts]);

  // ── Live text preview: relay section content to the running iframe the
  // instant it changes (no debounce, no reload) — see InviteLiveSections.
  // EditorSection has no db id/sortOrder (that's assigned on save); synthesize
  // stable positional ones so the preview's list keys stay steady across edits. ─
  useEffect(() => {
    const liveSections = sections
      .filter((s) => s.included)
      .map((s, i) => ({ id: `live-${s.type}-${i}`, type: s.type, sortOrder: i, content: s.content }));
    frameRefs.current[frontRef.current]?.contentWindow?.postMessage({ type: "anjeurn:live-content", sections: liveSections }, "*");
  }, [sections, front]);

  // ── Live preview follows the edited section ────────────────────────────────
  // Cover → reload to the gate view (the gate IS the cover); any other section
  // → tell the running preview to skip the gate and scroll there (no reload).
  useEffect(() => {
    if (firstFocus.current) { firstFocus.current = false; return; }
    if (!openType) return;
    if (openType === "cover") {
      reloadRef.current();
      return;
    }
    frameRefs.current[frontRef.current]?.contentWindow?.postMessage({ type: "anjeurn:focus", section: openType }, "*");
  }, [openType]);

  // Load the invitation web fonts into the editor so every font preview renders
  // in its real typeface (matching exactly what guests will see).
  useEffect(() => {
    if (document.querySelector("link[data-anjeurn-fonts]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = buildFontsHref();
    link.setAttribute("data-anjeurn-fonts", "");
    document.head.appendChild(link);
  }, []);

  // ── Gallery photos: write-through (no debounce — separate API) ─────────────
  async function addGalleryPhoto(file: File) {
    setGalleryBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "gallery");
      const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const { url } = await up.json();
      if (!up.ok || !url) return;
      const res = await fetch(`/api/admin/events/${event.id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const { photo } = await res.json();
      if (res.ok && photo) {
        setPhotos((p) => [...p, { id: photo.id, url: photo.url }]);
        reloadRef.current();
      }
    } finally {
      setGalleryBusy(false);
    }
  }

  async function removeGalleryPhoto(photoId: string) {
    await fetch(`/api/admin/events/${event.id}/photos?photoId=${photoId}`, { method: "DELETE" });
    setPhotos((p) => p.filter((x) => x.id !== photoId));
    reloadRef.current();
  }

  // ── Section list helpers ───────────────────────────────────────────────────
  const patchSection = (i: number, patch: Partial<EditorSection>) =>
    setSections((ss) => ss.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const patchContent = (i: number, patch: SectionContent) =>
    setSections((ss) => ss.map((x, j) => (j === i ? { ...x, content: { ...x.content, ...patch } } : x)));

  // ── Cover-element editing (used by the consolidated Cover panel) ───────────
  // Text lives on the cover section's content; color/font/size are per-element
  // overrides stored in `elementPositions` (shared with the drag layout box).
  const coverIdx = sections.findIndex((x) => x.type === "cover");
  const coverContent = (coverIdx >= 0 ? sections[coverIdx].content : {}) as SectionContent;
  const coverStr = (k: string) => (typeof coverContent[k] === "string" ? (coverContent[k] as string) : "");
  const patchCover = (patch: SectionContent) => { if (coverIdx >= 0) patchContent(coverIdx, patch); };
  const elemOv = (key: GateElementKey): GatePlace | undefined => elementPositions[key];
  const setElemOv = (key: GateElementKey, patch: Partial<GatePlace>) =>
    setElementPositions((prev) => ({ ...prev, [key]: { ...(prev[key] ?? GATE_DEFAULT_POSITIONS[key]), ...patch } }));
  /** Color + font + size + weight + align rows for a gate element, editing its `elementPositions` override. */
  const elemStyleRow = (key: GateElementKey, defColor: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ flex: "1 1 130px", minWidth: 130 }}>
          <FontPicker value={elemOv(key)?.font ?? ""} onChange={(v) => setElemOv(key, { font: v || undefined })}
            options={key === "title" || key === "guestName" ? HEADING_FONTS : BODY_FONTS} />
        </span>
        <span style={{ width: 92 }}>
          <SizeField value={elemOv(key)?.scale ?? 1} onChange={(v) => setElemOv(key, { scale: v === 1 ? undefined : v })} />
        </span>
        <ColorField value={elemOv(key)?.color || defColor} onChange={(v) => setElemOv(key, { color: v })} />
        {elemOv(key)?.color && (
          <button type="button" style={s.smallGhost} title="Use theme color" onClick={() => setElemOv(key, { color: undefined })}>×</button>
        )}
      </div>
      <WeightAlignRow weight={elemOv(key)?.weight} onWeight={(v) => setElemOv(key, { weight: v })}
        align={elemOv(key)?.align} onAlign={(v) => setElemOv(key, { align: v })} weightDefault={400} />
    </div>
  );
  const move = (i: number, dir: -1 | 1) =>
    setSections((ss) => {
      const j = i + dir;
      if (j < 0 || j >= ss.length) return ss;
      const next = [...ss];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // ── Drag-and-drop reordering ───────────────────────────────────────────────
  const dropOn = (target: number) => {
    const from = dragIdx.current;
    dragIdx.current = null;
    setDragOver(null);
    if (from === null || from === target) return;
    setSections((ss) => {
      const next = [...ss];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const addImageSection = () =>
    setSections((ss) => [
      ...ss,
      { type: "image", included: true, content: { mode: "image", imageUrl: "" } },
    ]);

  const statusLabel = {
    idle: "All changes saved", dirty: "Unsaved changes…", saving: "Saving…",
    saved: "Saved ✓ — preview updated", error: "Save failed — retrying on next edit",
  }[status];

  // Manual save — clears the pending debounce and writes immediately. Autosave
  // still runs; this is the explicit, always-visible affordance.
  const saveNow = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    void save();
  };
  const saveLabel = {
    idle: "Saved ✓", dirty: "Save now", saving: "Saving…", saved: "Saved ✓", error: "Retry save",
  }[status];
  const saveVariant =
    status === "error" ? s.saveBtnError :
    status === "dirty" || status === "saving" ? s.saveBtnDirty :
    s.saveBtnIdle;

  // Guided-step flow. Each step reveals a focused slice of the editor.
  const STEPS: Array<{ id: Step; label: string }> = [
    { id: "basics",   label: "Basics" },
    { id: "cover",    label: "Cover" },
    { id: "sections", label: "Sections" },
    { id: "buttons",  label: "Buttons" },
    { id: "guide",    label: "Guide" },
  ];
  const stepIdx = Math.max(0, STEPS.findIndex((x) => x.id === step));
  const goStep = (i: number) => setStep(STEPS[Math.max(0, Math.min(STEPS.length - 1, i))].id);

  // Real-content samples for the font-scheme previews, so each font renders with
  // exactly the text guests will read.
  const headingPreview = basics.title || undefined;
  const sectionTitlePreview =
    ((sections.find((x) => x.included && typeof (x.content as { title?: string }).title === "string" && (x.content as { title?: string }).title)?.content as { title?: string } | undefined)?.title) ||
    headingPreview;
  const bodyPreview =
    ((sections.find((x) => x.type === "wording")?.content as { text?: string } | undefined)?.text) ||
    ((sections.find((x) => x.type === "cover")?.content as { subheading?: string } | undefined)?.subheading) ||
    undefined;

  return (
    <div style={s.wrap}>
      {/* ── Left: editor panel ──────────────────────────────────────────── */}
      <div style={s.panel}>
        <div style={s.panelHead}>
          <div>
            <h1 style={s.h1}>Content</h1>
            <p style={s.statusLine} data-status={status}>{statusLabel}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={s.themeChip}>
              {themeName}{designLocked ? " 🔒" : ""} · <Link href={`/admin/events/${event.id}/design`} style={s.changeLink}>change</Link>
            </span>
            <button type="button" style={{ ...s.saveBtn, ...saveVariant }} disabled={status === "saving"} onClick={saveNow}>
              {saveLabel}
            </button>
          </div>
        </div>

        {/* ── Step progress ── */}
        <div style={s.stepper}>
          {STEPS.map((stp, i) => {
            const active = step === stp.id;
            const done = i < stepIdx;
            return (
              <button key={stp.id} type="button" style={{ ...s.stepChip, ...(active ? s.stepChipOn : {}) }} onClick={() => setStep(stp.id)}>
                <span style={{ ...s.stepNum, ...(active ? s.stepNumOn : {}), ...(done ? s.stepNumDone : {}) }}>{done ? "✓" : i + 1}</span>
                <span style={s.stepLabel}>{stp.label}</span>
              </button>
            );
          })}
        </div>

        {step === "basics" && (
        <>
        {/* Event basics */}
        <div style={s.card}>
          <div style={s.cardTitle}>Event</div>
          <Field label="Event title (internal)"><Txt value={basics.title} onChange={(v) => setBasics((b) => ({ ...b, title: v }))} /></Field>
          <p style={s.hint}>Used to identify this event in the admin — not shown to guests. Set the wording guests actually see under Cover → &ldquo;Names / heading&rdquo;.</p>
          <Field label="Date & time"><Txt type="datetime-local" value={basics.eventDate} onChange={(v) => setBasics((b) => ({ ...b, eventDate: v }))} /></Field>
          <Field label="Venue"><Txt value={basics.venueName} onChange={(v) => setBasics((b) => ({ ...b, venueName: v }))} /></Field>
          <Field label="Map URL"><Txt value={basics.venueMapUrl} onChange={(v) => setBasics((b) => ({ ...b, venueMapUrl: v }))} /></Field>
          <Field label="Gate / cover background — image, GIF or motion video">
            <MediaField value={coverUrl} onChange={(url) => setCoverUrl(url)} />
          </Field>
          <p style={s.hint}>This is the opening page guests see first (tap to open) — it also backs the cover section.</p>
        </div>
        </>
        )}

        {step === "cover" && (
        <>
        {/* Guest name — shown on the opening gate, personalized per guest link */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            Guest name
            <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem", textTransform: "none", letterSpacing: 0, fontWeight: 600, fontSize: "0.8rem", color: "var(--c-text)" }}>
              <input type="checkbox" checked={showGuestName} onChange={(e) => setShowGuestName(e.target.checked)} />
              Show
            </label>
          </div>
          {showGuestName && (
            <>
              <p style={s.hint}>Real guests see their own name here (from their invite link) — this text is only the preview placeholder.</p>
              <Field label="Prefix badge (e.g. ♥ Dear)">
                <Txt value={coverOpts.guestPrefix} onChange={(v) => setCoverOpts((o) => ({ ...o, guestPrefix: v }))} placeholder="Dear" />
              </Field>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ flex: "1 1 130px", minWidth: 130 }}>
                  <FontPicker value={coverOpts.guestPrefixFont} onChange={(v) => setCoverOpts((o) => ({ ...o, guestPrefixFont: v }))} options={BODY_FONTS} />
                </span>
                <span style={{ width: 100 }}>
                  <SizeField value={coverOpts.guestPrefixSize} onChange={(v) => setCoverOpts((o) => ({ ...o, guestPrefixSize: Math.round(v) }))} min={8} max={22} step={1} unit="px" />
                </span>
                <ColorField value={coverOpts.guestPrefixColor || themeDefaults.accent} onChange={(v) => setCoverOpts((o) => ({ ...o, guestPrefixColor: v }))} />
              </div>
              <select style={{ ...s.input }} value={coverOpts.guestPrefixWeight ?? ""}
                onChange={(e) => setCoverOpts((o) => ({ ...o, guestPrefixWeight: e.target.value ? +e.target.value : undefined }))}>
                <option value="">Weight: theme default</option>
                {WEIGHT_OPTIONS.map((w) => <option key={w.v} value={w.v}>{w.l} ({w.v})</option>)}
              </select>
              <TextFitRow value={coverOpts.guestPrefixFit} onChange={(v) => setCoverOpts((o) => ({ ...o, guestPrefixFit: v }))} />
              <Field label="Guest name (placeholder)"><Txt value={coverStr("guestLabel")} onChange={(v) => patchCover({ guestLabel: v })} placeholder="Dear Guest" /></Field>
              <Field label="Color · font · size">{elemStyleRow("guestName", themeDefaults.title || themeDefaults.primary)}</Field>
              <TextFitRow value={coverOpts.guestNameFit} onChange={(v) => setCoverOpts((o) => ({ ...o, guestNameFit: v }))} />
              <p style={s.hint}>Real guest names vary in length — &ldquo;Shrink to fit&rdquo; keeps long names on one line by scaling them down automatically; &ldquo;Wrap&rdquo; lets them break onto a second line instead.</p>
              <Field label="Decorative frame (optional)">
                <ImgField value={guestFrameUrl} onChange={setGuestFrameUrl} />
              </Field>
            </>
          )}
        </div>

        {/* Opening gate layout — drag each element to arrange the gate freely */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            Opening gate layout
            {Object.keys(elementPositions).length > 0 && (
              <button type="button" style={{ ...s.smallGhost, marginLeft: "auto" }} onClick={() => setElementPositions({})}>
                ↺ Reset to default layout
              </button>
            )}
          </div>
          <p style={s.hint}>Drag any element to move it; click one to select it and drag a corner or edge handle to resize — just like Canva or Photoshop. Its <strong>text, color &amp; font</strong> are edited in the cards below. This is the real cover — everything matches the live invite.</p>
          <GateWysiwygEditor
            positions={elementPositions}
            onChange={setElementPositions}
            data={{
              title: coverStr("heading") || basics.title,
              greeting: ((sections.find((x) => x.type === "cover")?.content as { greeting?: string } | undefined)?.greeting) ?? "",
              subheading: ((sections.find((x) => x.type === "cover")?.content as { subheading?: string } | undefined)?.subheading) ?? "",
              guestLabel: ((sections.find((x) => x.type === "cover")?.content as { guestLabel?: string } | undefined)?.guestLabel) ?? "Dear Guest",
              bgUrl: coverUrl,
              monogramUrl: ((sections.find((x) => x.type === "cover")?.content as { logoUrl?: string } | undefined)?.logoUrl) ?? "",
              showMonogram: monogram.gate,
              showGuestName,
              accent: colors.accent || themeDefaults.accent,
              primary: colors.title || colors.text || themeDefaults.title || themeDefaults.primary,
              muted: colors.muted || themeDefaults.muted,
              headingFont: fonts.heading || themeDefaults.headingFont,
              gateBg: bg.gateColor || "",
              guestPrefix: coverOpts.guestPrefix || undefined,
              guestPrefixColor: coverOpts.guestPrefixColor || undefined,
              guestPrefixFont: coverOpts.guestPrefixFont || undefined,
              guestPrefixSize: coverOpts.guestPrefixSize || undefined,
              guestPrefixWeight: coverOpts.guestPrefixWeight || undefined,
              guestPrefixFit: coverOpts.guestPrefixFit,
              guestNameFit: coverOpts.guestNameFit,
              openBtnColor: coverOpts.openButtonColor || undefined,
              openBtnStroke: coverOpts.openButtonStroke || undefined,
              openBtnFill: coverOpts.openButtonFill || undefined,
              openBtnText: coverOpts.openButtonText || undefined,
              openBtnFont: coverOpts.openButtonFont || undefined,
              openBtnSize: coverOpts.openButtonSize || undefined,
              openBtnWeight: coverOpts.openButtonWeight || undefined,
              openBtnStrokeEnabled: coverOpts.openButtonStrokeEnabled,
              openBtnFillEnabled: coverOpts.openButtonFillEnabled,
              openBtnFit: coverOpts.openButtonFit,
              pretitleFit: coverOpts.pretitleFit,
              titleFit: coverOpts.titleFit,
              subheadingFit: coverOpts.subheadingFit,
            }}
          />
        </div>

        {/* Greeting element */}
        <div style={s.card}>
          <div style={s.cardTitle}>Greeting</div>
          <Field label="Text"><Txt value={coverStr("greeting")} onChange={(v) => patchCover({ greeting: v })} placeholder="You are invited to" /></Field>
          <Field label="Color · font · size">{elemStyleRow("pretitle", themeDefaults.accent)}</Field>
          <TextFitRow value={coverOpts.pretitleFit} onChange={(v) => setCoverOpts((o) => ({ ...o, pretitleFit: v }))} />
        </div>

        {/* Names element — the big title on the gate/cover */}
        <div style={s.card}>
          <div style={s.cardTitle}>Names</div>
          <Field label="Text"><Txt value={coverStr("heading")} onChange={(v) => patchCover({ heading: v })} placeholder="Sophea & Dara" /></Field>
          <p style={s.hint}>Leave blank to fall back to the event title set in <strong>Basics</strong>.</p>
          <Field label="Color · font · size">{elemStyleRow("title", themeDefaults.title || themeDefaults.primary)}</Field>
          <TextFitRow value={coverOpts.titleFit} onChange={(v) => setCoverOpts((o) => ({ ...o, titleFit: v }))} />
        </div>

        {/* Intro lines element */}
        <div style={s.card}>
          <div style={s.cardTitle}>Intro lines</div>
          <Field label="Text"><Area value={coverStr("subheading")} onChange={(v) => patchCover({ subheading: v })} rows={2} placeholder={"We invite you\nto our"} /></Field>
          <Field label="Color · font · size">{elemStyleRow("subtitle", themeDefaults.muted)}</Field>
          <TextFitRow value={coverOpts.subheadingFit} onChange={(v) => setCoverOpts((o) => ({ ...o, subheadingFit: v }))} />
        </div>

        {/* Open button element — label, font, size, colors */}
        <div style={s.card}>
          <div style={s.cardTitle}>Open button</div>
          <Field label="Label"><Txt value={coverOpts.openButtonText} onChange={(v) => setCoverOpts((o) => ({ ...o, openButtonText: v }))} placeholder="Open Letter" /></Field>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ flex: "1 1 130px", minWidth: 130 }}>
              <FontPicker value={coverOpts.openButtonFont} onChange={(v) => setCoverOpts((o) => ({ ...o, openButtonFont: v }))} options={BODY_FONTS} />
            </span>
            <span style={{ width: 100 }}>
              <SizeField value={coverOpts.openButtonSize} onChange={(v) => setCoverOpts((o) => ({ ...o, openButtonSize: Math.round(v) }))} min={8} max={22} step={1} unit="px" />
            </span>
          </div>
          <select style={{ ...s.input }} value={coverOpts.openButtonWeight ?? ""}
            onChange={(e) => setCoverOpts((o) => ({ ...o, openButtonWeight: e.target.value ? +e.target.value : undefined }))}>
            <option value="">Weight: theme default</option>
            {WEIGHT_OPTIONS.map((w) => <option key={w.v} value={w.v}>{w.l} ({w.v})</option>)}
          </select>
          <Field label="Text color">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ColorField value={coverOpts.openButtonColor || themeDefaults.accent} onChange={(v) => setCoverOpts((o) => ({ ...o, openButtonColor: v }))} />
              {coverOpts.openButtonColor && (
                <button type="button" style={s.smallGhost} onClick={() => setCoverOpts((o) => ({ ...o, openButtonColor: "" }))}>Use theme color</button>
              )}
            </div>
          </Field>
          <label style={s.checkRow}>
            <input type="checkbox" checked={coverOpts.openButtonStrokeEnabled}
              onChange={(e) => setCoverOpts((o) => ({ ...o, openButtonStrokeEnabled: e.target.checked }))} />
            Show stroke (border)
          </label>
          {coverOpts.openButtonStrokeEnabled && (
            <Field label="Stroke color">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ColorField value={coverOpts.openButtonStroke || coverOpts.openButtonColor || themeDefaults.accent} onChange={(v) => setCoverOpts((o) => ({ ...o, openButtonStroke: v }))} />
                {coverOpts.openButtonStroke && (
                  <button type="button" style={s.smallGhost} onClick={() => setCoverOpts((o) => ({ ...o, openButtonStroke: "" }))}>Match text</button>
                )}
              </div>
            </Field>
          )}
          <label style={s.checkRow}>
            <input type="checkbox" checked={coverOpts.openButtonFillEnabled}
              onChange={(e) => setCoverOpts((o) => ({ ...o, openButtonFillEnabled: e.target.checked }))} />
            Show fill (background)
          </label>
          {coverOpts.openButtonFillEnabled && (
            <Field label="Fill color">
              <ColorField value={coverOpts.openButtonFill || "#000000"} onChange={(v) => setCoverOpts((o) => ({ ...o, openButtonFill: v }))} />
            </Field>
          )}
          <TextFitRow value={coverOpts.openButtonFit} onChange={(v) => setCoverOpts((o) => ({ ...o, openButtonFit: v }))} />
        </div>

        {/* Opening behaviour — animation, keep cover */}
        <div style={s.card}>
          <div style={s.cardTitle}>Opening behaviour</div>
          <label style={s.checkRow}>
            <input type="checkbox" checked={coverOpts.animateOpen}
              onChange={(e) => setCoverOpts((o) => ({ ...o, animateOpen: e.target.checked }))} />
            Animate when the cover opens into the pages
          </label>
          <label style={s.checkRow}>
            <input type="checkbox" checked={coverOpts.keepCoverAfterOpen}
              onChange={(e) => setCoverOpts((o) => ({ ...o, keepCoverAfterOpen: e.target.checked }))} />
            Keep the cover as the first page after opening
          </label>
          <p style={s.hint}>Turn off &ldquo;keep cover&rdquo; to land guests straight on the content — the cover then lives only as the opening gate, and closes with a smooth fade/zoom-out when tapped.</p>
          <label style={s.checkRow}>
            <input type="checkbox" checked={coverOpts.openOnScroll}
              onChange={(e) => setCoverOpts((o) => ({ ...o, openOnScroll: e.target.checked }))} />
            Also open by scrolling or swiping up on the cover
          </label>
          {!coverOpts.openOnScroll && (
            <p style={s.hint}>Guests can still tap the &ldquo;Open&rdquo; button — this just adds a scroll/swipe shortcut.</p>
          )}
        </div>
        </>
        )}

        {step === "sections" && (
        <>
        {/* Languages — bilingual invitation */}
        <div style={s.card}>
          <div style={s.cardTitle}>Languages</div>
          <label style={s.checkRow}>
            <input type="checkbox" checked={languages.enabled}
              onChange={(e) => setLanguages((l) => ({ ...l, enabled: e.target.checked }))} />
            Bilingual invitation — guests switch the whole content with a toggle button
          </label>
          {languages.enabled && (
            <>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Field label="Language 1 label">
                  <Txt value={languages.primaryLabel} onChange={(v) => setLanguages((l) => ({ ...l, primaryLabel: v }))} placeholder="ខ្មែរ" />
                </Field>
                <Field label="Language 2 label">
                  <Txt value={languages.secondaryLabel} onChange={(v) => setLanguages((l) => ({ ...l, secondaryLabel: v }))} placeholder="EN" />
                </Field>
              </div>
              <p style={s.hint}>
                Write sections in language 1, then switch the editing language (in Sections below) and
                enter the translation. Untranslated fields fall back to language 1.
              </p>
            </>
          )}
        </div>

        {/* Sections — drag to reorder; text- or image-based */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            Sections
            {languages.enabled && (
              <span style={{ marginLeft: "auto", display: "inline-flex", gap: "0.25rem", textTransform: "none", letterSpacing: 0 }}>
                {([["primary", languages.primaryLabel], ["secondary", languages.secondaryLabel]] as const).map(([k, l]) => (
                  <button key={k} type="button"
                    style={{ ...s.smallBtn, padding: "0.2rem 0.55rem", ...(editLang === k ? s.smallBtnOn : {}) }}
                    onClick={() => setEditLang(k)}>
                    ✎ {l}
                  </button>
                ))}
              </span>
            )}
            <span style={{ marginLeft: languages.enabled ? "0.6rem" : "auto", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>drag ⠿ to reorder</span>
          </div>
          {sections.map((sec, i) => {
            const meta = SECTION_META[sec.type] ?? { label: sec.type, icon: "▫" };
            const key = sec.type + i;
            const isOpen = open === key;
            return (
              <div
                key={key}
                style={{ ...s.secBox, ...(dragOver === i ? { outline: "2px dashed var(--c-accent)", outlineOffset: 1 } : {}) }}
                data-off={!sec.included}
                onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                onDragLeave={() => setDragOver((d) => (d === i ? null : d))}
                onDrop={(e) => { e.preventDefault(); dropOn(i); }}
              >
                <div style={s.secHead}>
                  <span
                    draggable
                    onDragStart={(e) => { dragIdx.current = i; e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
                    style={s.dragHandle}
                    title="Drag to reorder"
                  >⠿</span>
                  <button type="button" style={s.secToggleBtn}
                    onClick={() => { setOpen(isOpen ? null : key); setOpenType(isOpen ? null : sec.type); }}>
                    <span>{meta.icon}</span>
                    <span style={{ fontWeight: 600 }}>{meta.label}</span>
                    {sec.content.mode === "image" && <span style={s.modeBadge}>image</span>}
                    <span style={{ marginLeft: "auto", color: "var(--c-muted)" }}>{isOpen ? "▾" : "▸"}</span>
                  </button>
                  <button type="button" style={s.tinyGhost} title="Move up"   onClick={() => move(i, -1)}>↑</button>
                  <button type="button" style={s.tinyGhost} title="Move down" onClick={() => move(i, 1)}>↓</button>
                  {sec.type !== "cover" && (
                    <button type="button" style={s.tinyGhost} title="Remove section"
                      onClick={() => {
                        if (!window.confirm(`Remove this ${SECTION_META[sec.type]?.label ?? sec.type} section?`)) return;
                        setSections((ss) => ss.filter((_, j) => j !== i));
                        if (isOpen) { setOpen(null); setOpenType(null); }
                      }}>✕</button>
                  )}
                  <label style={s.incRow} title="Show on invitation">
                    <input type="checkbox" checked={sec.included} onChange={(e) => patchSection(i, { included: e.target.checked })} />
                  </label>
                </div>
                {isOpen && (
                  <div style={s.secBody}>
                    <SectionForm sec={sec} onContent={(patch) => patchContent(i, patch)} locked={designLocked}
                      altLang={languages.enabled && editLang === "secondary"} />
                    {sec.type === "gallery" && (
                      <>
                        <div style={s.subHead}>Photos</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          {photos.map((p) => (
                            <span key={p.id} style={{ position: "relative" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.url} alt="" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 6, border: "1px solid var(--c-border)" }} />
                              <button type="button" style={s.photoDel} onClick={() => removeGalleryPhoto(p.id)}>✕</button>
                            </span>
                          ))}
                          <button type="button" style={{ ...s.smallBtn, height: 54 }} disabled={galleryBusy}
                            onClick={() => galleryFileRef.current?.click()}>
                            {galleryBusy ? "…" : "+ Add"}
                          </button>
                          <input ref={galleryFileRef} type="file" accept="image/*" hidden
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) void addGalleryPhoto(f); e.target.value = ""; }} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button type="button" style={s.smallBtn} onClick={addImageSection}>
            + Add image section
          </button>
        </div>
        </>
        )}

        {step === "basics" && (designLocked ? (
          <div style={s.card}>
            <div style={s.cardTitle}>🔒 Design locked</div>
            <p style={s.hint}>
              <strong>{themeName}</strong> is a preset theme — its design (colors, fonts, layout) is
              fixed so the invitation always looks exactly as designed. You can still update all
              content in the Content tab. To customize the design freely, switch to the Standard
              theme or the Freeform builder in the{" "}
              <Link href={`/admin/events/${event.id}/design`} style={s.changeLink}>Design step</Link>.
            </p>
          </div>
        ) : (
        <>
        {/* Font scheme — Title / Header / Body (theme setup stage) */}
        <details style={s.card}>
          <summary style={s.collapsibleTitle}>▸ Fonts</summary>
          <p style={s.hint}>Sets the typography for the whole invitation. Individual sections can fine-tune on top via their “Text style” panel.</p>
          <Field label="Title font — covers, big headings">
            <FontPicker value={fonts.heading} onChange={(v) => setFonts((f) => ({ ...f, heading: v }))} options={HEADING_FONTS} previewText={headingPreview} />
          </Field>
          <Field label="Title color">
            <ColorField value={colors.title ?? ""} onChange={(v) => setColors((c) => setOrClear(c, "title", v))} />
          </Field>
          <Field label="Title size">
            <SizeField value={fonts.headingScale} onChange={(v) => setFonts((f) => ({ ...f, headingScale: v }))} />
          </Field>
          <Field label="Header font — section labels">
            <FontPicker value={fonts.header} onChange={(v) => setFonts((f) => ({ ...f, header: v }))} options={HEADING_FONTS} previewText={sectionTitlePreview} />
          </Field>
          <Field label="Header color">
            <ColorField value={colors.header ?? ""} onChange={(v) => setColors((c) => setOrClear(c, "header", v))} />
          </Field>
          <Field label="Body font — paragraphs & details">
            <FontPicker value={fonts.body} onChange={(v) => setFonts((f) => ({ ...f, body: v }))} options={BODY_FONTS} previewText={bodyPreview} />
          </Field>
          <Field label="Body color">
            <ColorField value={colors.body ?? ""} onChange={(v) => setColors((c) => setOrClear(c, "body", v))} />
          </Field>
          <Field label="Body size">
            <SizeField value={fonts.bodyScale} onChange={(v) => setFonts((f) => ({ ...f, bodyScale: v }))} />
          </Field>
        </details>

        {/* Colors */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            Colors
            {Object.keys(colors).length > 0 && (
              <button type="button" style={{ ...s.smallGhost, marginLeft: "auto" }} onClick={() => setColors({})}>
                Reset to theme defaults
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {COLOR_KEYS.map(({ key, label }) => (
              <label key={key} style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.7rem", color: "var(--c-muted)" }}>
                {label}
                <ColorField value={colors[key] ?? ""} onChange={(v) => setColors((c) => setOrClear(c, key, v))} />
              </label>
            ))}
          </div>
          <p style={s.hint}>Leave untouched to use the theme&rsquo;s own palette.</p>
        </div>

        {/* Backgrounds — media (image / GIF / motion video), plain color, blur */}
        <details style={s.card}>
          <summary style={s.collapsibleTitle}>▸ Backgrounds (cover, sections &amp; desktop)</summary>

          <div style={s.subHead}>Cover (opening page)</div>
          <p style={s.hint}>The cover media is uploaded in Content → “Gate / cover background”. Without media, the color below is used.</p>
          <Field label="Plain color (no media)">
            <ColorField value={bg.gateColor} onChange={(v) => setBg((b) => ({ ...b, gateColor: v }))} />
          </Field>
          <Field label="Background blur">
            <SizeField value={bg.coverBlur} onChange={(v) => setBg((b) => ({ ...b, coverBlur: Math.round(v) }))} min={0} max={20} step={1} unit="px" />
          </Field>
          <Field label="Background dim">
            <label style={s.checkRow}>
              <input type="checkbox" checked={gateOverlay.enabled}
                onChange={(e) => setGateOverlay((o) => ({ ...o, enabled: e.target.checked }))} />
              Darken the cover background for readability
            </label>
          </Field>
          {gateOverlay.enabled && (
            <>
              <Field label="Dim color">
                <ColorField value={gateOverlay.color} onChange={(v) => setGateOverlay((o) => ({ ...o, color: v }))} />
              </Field>
              <Field label="Dim strength">
                <SizeField
                  value={Math.round(gateOverlay.opacity * 100)}
                  onChange={(v) => setGateOverlay((o) => ({ ...o, opacity: Math.max(0, Math.min(100, Math.round(v))) / 100 }))}
                  min={0} max={100} step={5} unit="%"
                />
              </Field>
            </>
          )}
          <p style={s.hint}>The dim only applies when a cover image or video is set.</p>

          <div style={s.subHead}>Sections</div>
          <Field label="Background media — image, GIF or motion video">
            <MediaField
              value={bg.video || bg.image}
              onChange={(url, isVideo) => setBg((b) => ({ ...b, image: isVideo ? "" : url, video: isVideo ? url : "" }))}
            />
          </Field>
          <Field label="Plain color (no media)">
            <ColorField value={bg.pageColor} onChange={(v) => setBg((b) => ({ ...b, pageColor: v }))} />
          </Field>
          <Field label="Background blur">
            <SizeField value={bg.sectionBlur} onChange={(v) => setBg((b) => ({ ...b, sectionBlur: Math.round(v) }))} min={0} max={20} step={1} unit="px" />
          </Field>
          <Field label="Background dim">
            <label style={s.checkRow}>
              <input type="checkbox" checked={sectionOverlay.enabled}
                onChange={(e) => setSectionOverlay((o) => ({ ...o, enabled: e.target.checked }))} />
              Darken the background media for readability
            </label>
          </Field>
          {sectionOverlay.enabled && (
            <>
              <Field label="Dim color">
                <ColorField value={sectionOverlay.color} onChange={(v) => setSectionOverlay((o) => ({ ...o, color: v }))} />
              </Field>
              <Field label="Dim strength">
                <SizeField
                  value={Math.round(sectionOverlay.opacity * 100)}
                  onChange={(v) => setSectionOverlay((o) => ({ ...o, opacity: Math.max(0, Math.min(100, Math.round(v))) / 100 }))}
                  min={0} max={100} step={5} unit="%"
                />
              </Field>
            </>
          )}
          <p style={s.hint}>Fits inside the portrait invite only — it never bleeds into the wide desktop backdrop below. The dim only applies when a background image/video is set.</p>

          <div style={s.subHead}>Desktop backdrop (around the portrait invite)</div>
          <p style={s.hint}>A separate image or color filling the area around the invite on wide screens. Not shown on mobile — the invite already fills the screen there.</p>
          <Field label="Background image">
            <ImgField value={outerBg.url} onChange={(url) => setOuterBg((b) => ({ ...b, url }))} />
          </Field>
          <Field label="Plain color (no image)">
            <ColorField value={outerBg.color} onChange={(v) => setOuterBg((b) => ({ ...b, color: v }))} />
          </Field>
        </details>

        {/* Monogram placement */}
        <div style={s.card}>
          <div style={s.cardTitle}>Monogram</div>
          <p style={s.hint}>Upload the monogram image in Content → Cover. Choose where it appears:</p>
          {!hasLogo && <p style={s.hint}><strong>No monogram uploaded yet</strong> — upload one in Content → Cover to enable these.</p>}
          <label style={{ ...s.checkRow, opacity: hasLogo ? 1 : 0.5, cursor: hasLogo ? "pointer" : "default" }}>
            <input type="checkbox" checked={hasLogo && monogram.gate} disabled={!hasLogo}
              onChange={(e) => setMonogram((m) => ({ ...m, gate: e.target.checked }))} />
            On the opening gate (landing screen)
          </label>
          <label style={{ ...s.checkRow, opacity: hasLogo ? 1 : 0.5, cursor: hasLogo ? "pointer" : "default" }}>
            <input type="checkbox" checked={hasLogo && monogram.sections} disabled={!hasLogo}
              onChange={(e) => setMonogram((m) => ({ ...m, sections: e.target.checked }))} />
            On the cover section (after opening)
          </label>
        </div>
        </>
        ))}

        {step === "buttons" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Floating buttons</div>
          <p style={s.hint}>The action buttons floating over the invitation (RSVP, gift, map, music).</p>

          <Field label="Position">
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {([["right", "Right stack"], ["left", "Left stack"], ["bar", "Bottom tab bar"]] as const).map(([v, l]) => (
                <button key={v} type="button"
                  style={{ ...s.smallBtn, ...(fab.position === v ? s.smallBtnOn : {}) }}
                  onClick={() => setFab((f) => ({ ...f, position: v }))}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          {fab.position === "bar" && (
            <p style={s.hint}>Bottom tab bar renders as one connected bar docked to the edge, like a regular app&apos;s tab bar.</p>
          )}

          <div style={s.subHead}>Colors</div>
          <label style={s.checkRow}>
            <input type="checkbox" checked={!actionButton} onChange={(e) => setActionButton(e.target.checked ? null : { bg: "#1a1a1a", color: "#ffffff" })} />
            Use theme&apos;s own colors
          </label>
          {actionButton ? (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.7rem", color: "var(--c-muted)" }}>
                Button color
                <ColorField value={actionButton.bg} onChange={(v) => setActionButton((a) => ({ bg: v, color: a?.color ?? "#ffffff" }))} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.7rem", color: "var(--c-muted)" }}>
                Icon color
                <ColorField value={actionButton.color} onChange={(v) => setActionButton((a) => ({ bg: a?.bg ?? "#1a1a1a", color: v }))} />
              </label>
            </div>
          ) : (
            <p style={s.hint}>Uncheck to pick a custom button color and icon color.</p>
          )}

          <Field label="Style">
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {([["circle", "● Circle"], ["rounded", "▢ Rounded"], ["square", "■ Square"]] as const).map(([v, l]) => (
                <button key={v} type="button"
                  style={{ ...s.smallBtn, ...(fab.shape === v ? s.smallBtnOn : {}) }}
                  onClick={() => setFab((f) => ({ ...f, shape: v }))}>
                  {l}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Size">
            <SizeField value={fab.size} onChange={(v) => setFab((f) => ({ ...f, size: Math.round(v) }))} min={36} max={64} step={2} unit="px" />
          </Field>

          <Field label="Hover effect">
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {([["none", "None"], ["lift", "Lift"], ["glow", "Glow"], ["pulse", "Pulse"]] as const).map(([v, l]) => (
                <button key={v} type="button"
                  style={{ ...s.smallBtn, ...(fab.hover === v ? s.smallBtnOn : {}) }}
                  onClick={() => setFab((f) => ({ ...f, hover: v }))}>
                  {l}
                </button>
              ))}
            </div>
          </Field>

          <div style={s.subHead}>Visibility</div>
          {([["rsvp", "RSVP button"], ["khqr", "Gift / KHQR button"], ["map", "Map / directions button"], ["music", "Music button"]] as const).map(([k, l]) => (
            <label key={k} style={s.checkRow}>
              <input type="checkbox" checked={fab.show[k]}
                onChange={(e) => setFab((f) => ({ ...f, show: { ...f.show, [k]: e.target.checked } }))} />
              {l}
            </label>
          ))}
          <p style={s.hint}>Buttons only appear when the matching feature is available (package, uploaded music, map URL…).</p>
        </div>
        )}

        {step === "guide" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Guidance overlay</div>
          <p style={s.hint}>A one-time hint shown after the guest opens the invitation, guiding them to scroll. It dismisses on tap or scroll.</p>
          <label style={s.checkRow}>
            <input type="checkbox" checked={guide.enabled} onChange={(e) => setGuide((g) => ({ ...g, enabled: e.target.checked }))} />
            Show the guidance overlay
          </label>
          {guide.enabled && (
            <Field label="Guidance text">
              <Txt value={guide.text} onChange={(v) => setGuide((g) => ({ ...g, text: v }))} placeholder="Scroll to explore" />
            </Field>
          )}

          <div style={s.subHead}>Hand icon</div>
          <p style={s.hint}>Used on the “Open” button of the gate and on the guidance overlay.</p>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            <button type="button"
              style={{ ...s.smallBtn, ...(guideHand.kind === "default" ? s.smallBtnOn : {}) }}
              onClick={() => setGuideHand({ kind: "default", value: "" })}>
              ✎ Drawn hand
            </button>
            {["👆", "☝️", "🫵", "🖐", "👇", "🤙"].map((e) => (
              <button key={e} type="button" title="Use this emoji"
                style={{ ...s.smallBtn, fontSize: "1rem", padding: "0.25rem 0.5rem", ...(guideHand.kind === "emoji" && guideHand.value === e ? s.smallBtnOn : {}) }}
                onClick={() => setGuideHand({ kind: "emoji", value: e })}>
                {e}
              </button>
            ))}
          </div>
          <Field label="Or upload a custom icon image">
            <ImgField
              value={guideHand.kind === "image" ? guideHand.value : ""}
              onChange={(v) => setGuideHand(v ? { kind: "image", value: v } : { kind: "default", value: "" })}
            />
          </Field>
        </div>
        )}

        {step === "guide" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Section transition</div>
          <p style={s.hint}>How each section plays in the first time a guest scrolls it into view. A section can override this under its own Text style panel.</p>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {SECTION_EFFECTS.map((eff) => (
              <button key={eff.id} type="button"
                style={{ ...s.smallBtn, ...(sectionEffect === eff.id ? s.smallBtnOn : {}) }}
                onClick={() => setSectionEffect(eff.id)}>
                {eff.label}
              </button>
            ))}
          </div>
        </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
          <button type="button" style={{ ...s.smallBtn, visibility: stepIdx === 0 ? "hidden" : "visible" }}
            onClick={() => goStep(stepIdx - 1)}>← Back</button>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button type="button" style={{ ...s.saveBtn, ...saveVariant }} disabled={status === "saving"} onClick={saveNow}>
              {saveLabel}
            </button>
            {stepIdx < STEPS.length - 1 ? (
              <button type="button" style={s.nextBtn} onClick={() => goStep(stepIdx + 1)}>
                Next: {STEPS[stepIdx + 1].label} →
              </button>
            ) : (
              <Link href={`/admin/events/${event.id}/publish`} style={s.nextBtn}>Next: Publish →</Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: live device preview (the real invite page) ─────────────── */}
      <div style={s.previewCol}>
        <div style={s.previewBar}>
          <span style={{ fontSize: "0.8rem", color: "var(--c-muted)" }}>Live preview — real guest experience</span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button type="button" style={s.smallBtn} onClick={() => reloadRef.current()}>↻ Reload</button>
            <a href={`/invite/${event.slug}?preview=1`} target="_blank" rel="noreferrer" style={s.smallBtn}>Open ↗</a>
          </div>
        </div>
        <div style={s.phone}>
          {[0, 1].map((i) => (
            <iframe
              key={i}
              ref={(el) => { frameRefs.current[i] = el; }}
              src={srcs[i]}
              onLoad={() => onFrameLoad(i)}
              style={{
                ...s.phoneScreen,
                position: "absolute",
                inset: 0,
                opacity: front === i ? 1 : 0,
                transition: "opacity 200ms ease",
                pointerEvents: front === i ? "auto" : "none",
              }}
              title="Live invitation preview"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = {
  wrap: { display: "flex", gap: "1.5rem", alignItems: "flex-start", maxWidth: 1280, margin: "0 auto" },
  panel: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, gap: "1rem", maxHeight: "calc(100vh - 4rem)", overflowY: "auto" as const, paddingRight: 4 },
  panelHead: { position: "sticky" as const, top: 0, zIndex: 5, background: "var(--c-bg)", paddingBottom: "0.6rem", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" },
  h1: { margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--c-text)" },
  statusLine: { margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--c-muted)" },
  themeChip: { fontSize: "0.8rem", fontWeight: 600, color: "var(--c-text)", background: "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: 999, padding: "0.3rem 0.8rem", whiteSpace: "nowrap" as const },
  changeLink: { color: "var(--c-accent)", textDecoration: "none" },
  nextBtn: { padding: "0.55rem 1.25rem", background: "var(--c-accent)", color: "var(--c-lime-text)", borderRadius: 8, textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap" as const },
  saveBtn: { padding: "0.5rem 1.1rem", borderRadius: 8, border: "none", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const },
  saveBtnDirty: { background: "var(--c-accent)", color: "var(--c-lime-text)" },
  saveBtnIdle: { background: "var(--c-surface-2)", color: "var(--c-muted)", border: "1px solid var(--c-border)" },
  saveBtnError: { background: "#dc2626", color: "#fff" },

  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column" as const, gap: "0.6rem" },
  cardTitle: { fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--c-muted)", display: "flex", alignItems: "center" },
  collapsibleTitle: { fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--c-text)", cursor: "pointer", listStyle: "none" as const, userSelect: "none" as const },
  hint: { margin: 0, fontSize: "0.72rem", color: "var(--c-muted)" },
  subHead: { fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--c-muted)", marginTop: "0.5rem" },

  field: { display: "flex", flexDirection: "column" as const, gap: 3 },
  fieldLabel: { fontSize: "0.72rem", fontWeight: 600, color: "var(--c-muted)" },
  input: { width: "100%", boxSizing: "border-box" as const, padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", fontSize: "0.85rem", fontFamily: "inherit" },
  colorInput: { width: 40, height: 26, padding: 0, border: "1px solid var(--c-border)", borderRadius: 6, background: "none", cursor: "pointer" },
  rowGroup: { display: "flex", gap: "0.35rem", alignItems: "center" },

  smallBtn: { padding: "0.35rem 0.7rem", borderRadius: 7, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textDecoration: "none" },
  smallBtnOn: { background: "var(--c-accent)", color: "var(--c-lime-text)", border: "1px solid var(--c-accent)" },
  iconChoice: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 2, borderRadius: 7, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-muted)", cursor: "pointer" },
  iconChoiceOn: { border: "2px solid var(--c-accent)", background: "var(--c-accent-soft)", color: "var(--c-text)" },

  tabBar: { display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--c-border)", paddingBottom: 0 },
  tabBtn: { padding: "0.5rem 0.9rem", border: "none", background: "transparent", color: "var(--c-muted)", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  tabBtnOn: { color: "var(--c-accent)", boxShadow: "inset 0 -2px 0 var(--c-accent)" },

  stepper: { display: "flex", gap: "0.3rem", flexWrap: "wrap" as const, padding: "0.3rem 0.1rem", borderBottom: "1px solid var(--c-border)", paddingBottom: "0.6rem" },
  stepChip: { display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.6rem", borderRadius: 999, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-muted)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  stepChipOn: { border: "1px solid var(--c-accent)", color: "var(--c-text)", background: "var(--c-accent-soft)" },
  stepLabel: { whiteSpace: "nowrap" as const },
  stepNum: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "var(--c-surface)", border: "1px solid var(--c-border)", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 },
  stepNumOn: { background: "var(--c-accent)", color: "var(--c-lime-text)", border: "1px solid var(--c-accent)" },
  stepNumDone: { background: "#22c55e", color: "#fff", border: "1px solid #22c55e" },

  dragHandle: { cursor: "grab", color: "var(--c-muted)", fontSize: "0.9rem", padding: "0 0.25rem", userSelect: "none" as const, touchAction: "none" as const },
  modeBadge: { fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--c-accent)", background: "var(--c-accent-soft)", borderRadius: 5, padding: "0.1rem 0.4rem" },
  checkRow: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.84rem", color: "var(--c-text)", cursor: "pointer" },
  smallGhost: { padding: "0.25rem 0.45rem", borderRadius: 6, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-muted)", fontSize: "0.72rem", cursor: "pointer" },
  tinyGhost: { padding: "0.15rem 0.35rem", borderRadius: 5, border: "none", background: "transparent", color: "var(--c-muted)", fontSize: "0.75rem", cursor: "pointer" },

  secBox: { border: "1px solid var(--c-border)", borderRadius: 10, overflow: "hidden" },
  secHead: { display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.5rem", background: "var(--c-surface-2)" },
  secToggleBtn: { display: "flex", alignItems: "center", gap: "0.45rem", flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", color: "var(--c-text)", fontSize: "0.84rem", padding: "0.2rem 0.25rem", textAlign: "left" as const },
  incRow: { display: "flex", alignItems: "center", paddingLeft: "0.3rem" },
  secBody: { padding: "0.75rem", display: "flex", flexDirection: "column" as const, gap: "0.55rem" },

  photoDel: { position: "absolute" as const, top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "#dc2626", color: "#fff", fontSize: "0.6rem", cursor: "pointer", lineHeight: 1 },

  previewCol: { width: 420, flexShrink: 0, position: "sticky" as const, top: "1rem" },
  previewBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" },
  phone: { position: "relative" as const, width: 395, height: 780, margin: "0 auto", borderRadius: 34, border: "10px solid #16181d", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden", background: "#11151c" },
  phoneScreen: { width: 375, height: 760, border: "none", display: "block" },
} as const;
