"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhonePreview, type PreviewSection } from "@/app/admin/themes/_components/PhonePreview";
import { HEADING_FONTS, BODY_FONTS, DEFAULT_FONTS, type FontOption } from "@/lib/themes/shared/standard-css";

// ── Types ────────────────────────────────────────────────────────────────────

type SectionType = "cover" | "wording" | "countdown" | "details" | "gallery" | "video" | "wishing" | "khqr";
type ContentType = "text" | "photo";
type BgAssetType = "image" | "video";
type OverlayStyle = "floating" | "bottomBar";
type MapInputType = "url" | "image";

interface DetailItem { icon: string; label: string; value: string }
interface PhotoDetailItem { imageUrl: string; caption: string }
interface KhqrItem { currency: string; qrImageUrl: string; recipientName: string; amount: string }

// Every section may carry an optional `hideTitle` flag (photo-mode title toggle).
type SectionContent =
  | { heading: string; subheading: string; imageUrl?: string; logoUrl?: string }
  | { text?: string; imageUrl?: string; title?: string; hideTitle?: boolean }
  | { targetDate: string; label: string; hideTitle?: boolean }
  | { items: DetailItem[]; photoItems?: PhotoDetailItem[]; hideTitle?: boolean }
  | { layout: "grid" | "masonry" | "slideshow"; hideTitle?: boolean }
  | { url: string; caption: string; thumbnailUrl?: string; hideTitle?: boolean }
  | { placeholder: string; backgroundImageUrl?: string; hideTitle?: boolean }
  | { items: KhqrItem[]; title?: string; hideTitle?: boolean };

interface WizardSection {
  type: SectionType;
  included: boolean;
  content: SectionContent;
}

interface ColorScheme {
  text: string;
  accent: string;
  title: string;
  subtitle: string;
  header: string;
  body: string;
  muted: string;
}

interface EventFonts { heading: string; body: string; headingScale: number; bodyScale: number }

interface OverlayConfig {
  style: OverlayStyle;
  map:    { enabled: boolean; inputType: MapInputType; url: string; imageUrl: string };
  music:  { enabled: boolean };
  goToTop:{ enabled: boolean };
  gifts:  { enabled: boolean };
  fonts: EventFonts;
  /** Background blur for the landing page (gate) in px. */
  backgroundBlur: number;
  /** Background blur for content sections in px. */
  sectionBlur: number;
  /** Additional color overlay rendered over content sections. */
  sectionOverlay: { enabled: boolean; color: string; opacity: number };
  /** Color overlay rendered over the landing page (gate). */
  gateOverlay: { enabled: boolean; color: string; opacity: number };
  /** Colors for the floating action buttons (RSVP, map, music, gifts). */
  actionButton: { bg: string; color: string };
  /** Animation played when the guest opens the invitation. */
  revealStyle: "fade" | "envelope" | "curtain" | "slideUp";
  /** Keep the cover as the first screen after opening (scroll-based); off = skip straight to content. */
  keepCoverAfterOpen: boolean;
  /** Show the animated "Scroll to explore" guide hand after the gate opens. */
  scrollGuide: boolean;
  /** Vertical placement of the landing-page (gate) content. */
  gatePosition: "top" | "center" | "bottom";
  /** Show guest name area on the landing page. */
  showGuestName: boolean;
  /** Decorative frame image URL for the guest name area. */
  guestFrameUrl: string | null;
  /** Monogram circle visibility per context. */
  monogram: { gate: boolean; sections: boolean };
  /** Drag-positioned gate element offsets (% of gate dimensions). */
  elementPositions?: Partial<Record<"monogram" | "pretitle" | "title" | "subtitle" | "guestName" | "openBtn", { xPct: number; yPct: number }>>;
  /** Show or hide the RSVP floating action button on the invite page. */
  showRsvp: boolean;
  /** Content-section palette. */
  colorScheme: ColorScheme;
  /** Landing-page (gate) palette. */
  gateColorScheme: ColorScheme;
}

export interface EventData {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  venueName: string | null;
  venueMapUrl: string | null;
  slug: string;
}

export interface InvitationData {
  id: string;
  contentType: string | null;
  defaultSections: unknown;
  overlayConfig: Record<string, unknown> | null;
  backgroundUrl: string | null;
  backgroundVideoUrl: string | null;
  coverUrl: string | null;
  musicUrl: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  isAnimated: boolean;
  isPublished: boolean;
  shareLink: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Anniversary", "Corporate", "Other"];

const SECTION_META: Record<SectionType, { label: string; icon: string; desc: string; locked?: boolean }> = {
  cover:     { label: "Cover",              icon: "◈",  desc: "Hero title, couple names & event date", locked: true },
  wording:   { label: "Formal Wording",     icon: "✒",  desc: "Invitation wording — a photo of it, or typed text" },
  countdown: { label: "Countdown",          icon: "⏱",  desc: "Live countdown timer to the event" },
  details:   { label: "Agenda / Details",   icon: "📋", desc: "Venue, time, dress code & agenda items" },
  gallery:   { label: "Gallery",            icon: "🖼",  desc: "Grid, masonry, or slideshow layout" },
  video:     { label: "Video",              icon: "▶",  desc: "Embedded video message or highlight" },
  wishing:   { label: "Wishing Well",       icon: "✨", desc: "Guests can leave digital wishes" },
  khqr:      { label: "KHQR Payment",       icon: "💳", desc: "Cambodian QR code for monetary gifts" },
};

const INITIAL_SECTIONS: WizardSection[] = [
  { type: "cover",     included: true,  content: { heading: "", subheading: "" } },
  { type: "wording",   included: false, content: { text: "", imageUrl: "", title: "Invitation" } },
  { type: "countdown", included: false, content: { targetDate: "", label: "Countdown to the big day" } },
  { type: "details",   included: true,  content: { items: [
    { icon: "📍", label: "Venue", value: "" },
    { icon: "🕐", label: "Time", value: "" },
    { icon: "👗", label: "Dress Code", value: "" },
  ], photoItems: [] } },
  { type: "gallery",   included: false, content: { layout: "grid" } },
  { type: "video",     included: false, content: { url: "", caption: "" } },
  { type: "wishing",   included: false, content: { placeholder: "Leave us a sweet message…" } },
  { type: "khqr",      included: false, content: { items: [] } },
];

type ColorPreset = { name: string } & ColorScheme;

const COLOR_PRESETS: ColorPreset[] = [
  { name: "Classic Gold",    text: "#ffffff", accent: "#c9a96e", title: "#ffffff",   subtitle: "rgba(255,255,255,0.88)", header: "#c9a96e",   body: "rgba(255,255,255,0.85)", muted: "rgba(255,255,255,0.52)" },
  { name: "Rose Blush",      text: "#fff0f5", accent: "#e91e8c", title: "#fff0f5",   subtitle: "rgba(255,240,245,0.9)",  header: "#e91e8c",   body: "rgba(255,240,245,0.85)", muted: "rgba(255,240,245,0.55)" },
  { name: "Sage Garden",     text: "#f0fff4", accent: "#38a169", title: "#f0fff4",   subtitle: "rgba(240,255,244,0.9)",  header: "#4ade80",   body: "rgba(240,255,244,0.85)", muted: "rgba(240,255,244,0.55)" },
  { name: "Ocean Blue",      text: "#e8f4f8", accent: "#2b6cb0", title: "#e8f4f8",   subtitle: "rgba(232,244,248,0.9)",  header: "#63b3ed",   body: "rgba(232,244,248,0.85)", muted: "rgba(232,244,248,0.52)" },
  { name: "Midnight Purple", text: "#f5f0ff", accent: "#805ad5", title: "#f5f0ff",   subtitle: "rgba(245,240,255,0.9)",  header: "#b794f4",   body: "rgba(245,240,255,0.85)", muted: "rgba(245,240,255,0.52)" },
  { name: "Warm Ivory",      text: "#fffff0", accent: "#d69e2e", title: "#fffff0",   subtitle: "rgba(255,255,240,0.9)",  header: "#d69e2e",   body: "rgba(255,255,240,0.85)", muted: "rgba(255,255,240,0.52)" },
];

const INITIAL_SCHEME: ColorScheme = {
  text:     "#ffffff",
  accent:   "#c9a96e",
  title:    "#ffffff",
  subtitle: "rgba(255,255,255,0.88)",
  header:   "#c9a96e",
  body:     "rgba(255,255,255,0.85)",
  muted:    "rgba(255,255,255,0.52)",
};

const INITIAL_OVERLAY: OverlayConfig = {
  style:   "floating",
  map:    { enabled: false, inputType: "url", url: "", imageUrl: "" },
  music:  { enabled: true },
  goToTop:{ enabled: true },
  gifts:  { enabled: false },
  fonts:  { heading: DEFAULT_FONTS.heading, body: DEFAULT_FONTS.body, headingScale: 1, bodyScale: 1 },
  backgroundBlur: 0,
  sectionBlur: 0,
  sectionOverlay: { enabled: false, color: "#000000", opacity: 0.25 },
  gateOverlay: { enabled: false, color: "#000000", opacity: 0.45 },
  actionButton: { bg: "rgba(0,0,0,0.5)", color: "#c9a96e" },
  revealStyle: "fade",
  keepCoverAfterOpen: true,
  scrollGuide: true,
  gatePosition: "center",
  showGuestName: true,
  guestFrameUrl: null,
  monogram: { gate: true, sections: false },
  showRsvp: true,
  colorScheme:     { ...INITIAL_SCHEME },
  gateColorScheme: { ...INITIAL_SCHEME },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toHex(color: string): string {
  if (!color) return "#ffffff";
  if (/^#[0-9a-f]{3,8}$/i.test(color.trim())) return color.trim().slice(0, 7);
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const hex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${hex(+m[1])}${hex(+m[2])}${hex(+m[3])}`;
  }
  return "#ffffff";
}

function parseSections(raw: unknown): WizardSection[] {
  if (!Array.isArray(raw) || raw.length === 0) return INITIAL_SECTIONS;
  if (typeof raw[0] !== "object" || raw[0] === null) return INITIAL_SECTIONS;
  const parsed = (raw as WizardSection[]).map(s => {
    if (s.type === "details") {
      const c = s.content as { items?: DetailItem[]; photoItems?: PhotoDetailItem[] };
      if (!c.photoItems) return { ...s, content: { items: c.items ?? [], photoItems: [] as PhotoDetailItem[] } } as WizardSection;
    }
    return s;
  });
  // Backfill any section types added after this event was saved (e.g. "wording"),
  // inserted right after their position in INITIAL_SECTIONS, excluded by default.
  const present = new Set(parsed.map((s) => s.type));
  for (let i = 0; i < INITIAL_SECTIONS.length; i++) {
    const init = INITIAL_SECTIONS[i];
    if (present.has(init.type)) continue;
    const prevType = INITIAL_SECTIONS[i - 1]?.type;
    const at = prevType ? parsed.findIndex((s) => s.type === prevType) + 1 : parsed.length;
    parsed.splice(at > 0 ? at : parsed.length, 0, { ...init, included: false });
  }
  return parsed;
}

function parseOverlay(raw: unknown): OverlayConfig {
  if (!raw || typeof raw !== "object") return INITIAL_OVERLAY;
  const r = raw as Partial<OverlayConfig>;
  const colorScheme = { ...INITIAL_OVERLAY.colorScheme, ...(r.colorScheme ?? {}) };
  return {
    ...INITIAL_OVERLAY,
    ...r,
    fonts: { ...INITIAL_OVERLAY.fonts, ...(r.fonts ?? {}) },
    backgroundBlur: r.backgroundBlur ?? 0,
    sectionBlur: (r as Partial<OverlayConfig>).sectionBlur ?? 0,
    sectionOverlay: { ...INITIAL_OVERLAY.sectionOverlay, ...((r as Partial<OverlayConfig>).sectionOverlay ?? {}) },
    gateOverlay: { ...INITIAL_OVERLAY.gateOverlay, ...((r as Partial<OverlayConfig>).gateOverlay ?? {}) },
    actionButton: { ...INITIAL_OVERLAY.actionButton, ...((r as Partial<OverlayConfig>).actionButton ?? {}) },
    revealStyle: (r as Partial<OverlayConfig>).revealStyle ?? INITIAL_OVERLAY.revealStyle,
    keepCoverAfterOpen: (r as Partial<OverlayConfig>).keepCoverAfterOpen ?? INITIAL_OVERLAY.keepCoverAfterOpen,
    scrollGuide: (r as Partial<OverlayConfig>).scrollGuide ?? INITIAL_OVERLAY.scrollGuide,
    showGuestName: (r as Partial<OverlayConfig>).showGuestName ?? true,
    guestFrameUrl: (r as Partial<OverlayConfig>).guestFrameUrl ?? null,
    monogram: { ...INITIAL_OVERLAY.monogram, ...((r as Partial<OverlayConfig>).monogram ?? {}) },
    elementPositions: (r as Partial<OverlayConfig>).elementPositions,
    showRsvp: (r as Partial<OverlayConfig>).showRsvp ?? true,
    colorScheme,
    gateColorScheme: { ...colorScheme, ...(r.gateColorScheme ?? {}) },
  };
}

function toDateInputValue(iso: string): string {
  try { return new Date(iso).toISOString().split("T")[0]; } catch { return ""; }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => onChange(!on)}>
      <div style={{ ...t.pill, ...(on ? t.pillOn : t.pillOff) }}>
        <div style={{ ...t.knob, transform: on ? "translateX(18px)" : "translateX(2px)" }} />
      </div>
      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)" }}>{label}</div>
        {sub && <div style={{ fontSize: "0.75rem", color: "var(--c-muted)" }}>{sub}</div>}
      </div>
    </div>
  );
}
const t = {
  pill:    { width: 40, height: 22, borderRadius: 11, flexShrink: 0, position: "relative" as const, transition: "background 0.2s" },
  pillOn:  { background: "var(--c-accent)" },
  pillOff: { background: "var(--c-surface-2)", border: "1px solid var(--c-border)" },
  knob:    { position: "absolute" as const, top: 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "transform 0.2s" },
} as const;

// Collapsible card — a sectionCard whose body can be folded away to cut the
// long scroll on dense steps. Header click toggles open/closed.
function Collapsible({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={w.sectionCard}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", padding: 0, cursor: "pointer",
          marginBottom: open ? "0.625rem" : 0,
        }}
      >
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
        <span style={{ fontSize: "0.7rem", color: "var(--c-muted)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function FilePicker({ label, hint, accept, file, setFile, preview = false, optional = true }: {
  label: string; hint: string; accept: string;
  file: File | null; setFile: (f: File | null) => void;
  preview?: boolean; optional?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const objUrl = file && preview ? URL.createObjectURL(file) : null;
  const isVideo = accept.includes("video");
  return (
    <div style={fp.wrap}>
      <div style={fp.row}>
        {preview && (
          <div style={fp.thumb}>
            {objUrl ? isVideo ? <video src={objUrl} style={fp.img} muted /> : <img src={objUrl} alt="" style={fp.img} />
              : <span style={{ fontSize: "1.25rem", color: "var(--c-muted)" }}>{isVideo ? "🎬" : "⬆"}</span>}
          </div>
        )}
        <div style={fp.info}>
          <div style={fp.labelRow}>
            <span style={fp.lbl}>{label}</span>
            {optional && <span style={fp.opt}>optional</span>}
          </div>
          <div style={fp.hint}>{hint}</div>
          <div style={fp.btnRow}>
            <button type="button" onClick={() => ref.current?.click()} style={fp.pick}>{file ? "Change" : "Choose file"}</button>
            {file && <button type="button" onClick={() => setFile(null)} style={fp.rm}>Remove</button>}
            {file && <span style={fp.fname}>{file.name}</span>}
          </div>
        </div>
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
    </div>
  );
}
const fp = {
  wrap:     { paddingBottom: "0.75rem", marginBottom: "0.75rem", borderBottom: "1px solid var(--c-border)" },
  row:      { display: "flex", gap: "0.75rem", alignItems: "flex-start" },
  thumb:    { width: 52, height: 52, flexShrink: 0, borderRadius: 7, background: "var(--c-surface-2)", border: "1px solid var(--c-border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  img:      { width: "100%", height: "100%", objectFit: "cover" as const },
  info:     { flex: 1, minWidth: 0 },
  labelRow: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 2 },
  lbl:      { fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)" },
  opt:      { fontSize: "0.6875rem", color: "var(--c-muted)", background: "var(--c-surface-2)", borderRadius: 4, padding: "0.1rem 0.375rem" },
  hint:     { fontSize: "0.8125rem", color: "var(--c-muted)", marginBottom: "0.4rem" },
  btnRow:   { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" as const },
  pick:     { padding: "0.3rem 0.75rem", background: "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-text)" },
  rm:       { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8125rem", padding: 0 },
  fname:    { fontSize: "0.75rem", color: "var(--c-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 180 },
} as const;

function SectionImagePicker({ label, value, onChange, optional = true }: {
  label: string; value?: string; onChange: (url: string | undefined) => void; optional?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  async function handleFile(file: File) {
    setUploading(true); setErr("");
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", "themessections");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (!json.url) throw new Error("No URL returned");
      onChange(json.url);
    } catch (e) { setErr((e as Error).message); }
    finally { setUploading(false); }
  }
  return (
    <div style={{ marginBottom: "0.625rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <div style={{ width: 56, height: 44, flexShrink: 0, borderRadius: 7, background: "var(--c-surface-2)", border: "1px solid var(--c-border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {value ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.125rem", color: "var(--c-muted)" }}>🖼</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={ed.lbl}>{label}</span>
            {optional && <span style={fp.opt}>optional</span>}
          </div>
          <div style={fp.btnRow}>
            <button type="button" disabled={uploading} onClick={() => ref.current?.click()} style={fp.pick}>
              {uploading ? "Uploading…" : value ? "Change" : "Upload image"}
            </button>
            {value && !uploading && <button type="button" onClick={() => onChange(undefined)} style={fp.rm}>Remove</button>}
          </div>
          {err && <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>{err}</span>}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}

// ── Section editors ───────────────────────────────────────────────────────────

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", ...style }}>
    <label style={ed.lbl}>{label}</label>
    {children}
  </div>;
}

function CoverEditor({ c, set }: { c: { heading: string; subheading: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.g2}>
    <Field label="Heading"><input style={ed.inp} placeholder="We're Getting Married" value={c.heading} onChange={e => set({ ...c, heading: e.target.value })} /></Field>
    <Field label="Subheading"><input style={ed.inp} placeholder="Join us for our special day" value={c.subheading} onChange={e => set({ ...c, subheading: e.target.value })} /></Field>
  </div>;
}
function WordingEditor({ c, set }: { c: { text?: string; title?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.col}>
    <Field label="Section title"><input style={ed.inp} placeholder="Invitation" value={c.title ?? ""} onChange={e => set({ ...c, title: e.target.value })} /></Field>
    <Field label="Formal wording">
      <textarea style={{ ...ed.inp, minHeight: 120, resize: "vertical" }}
        placeholder={"Together with their families,\nSophea & Dara\nrequest the honour of your presence…"}
        value={c.text ?? ""} onChange={e => set({ ...c, text: e.target.value })} />
    </Field>
  </div>;
}
function PhotoWordingEditor({ c, set }: { c: { imageUrl?: string; title?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.col}>
    <Field label="Section title"><input style={ed.inp} placeholder="Invitation" value={c.title ?? ""} onChange={e => set({ ...c, title: e.target.value })} /></Field>
    <SectionImagePicker label="Wording photo — an image of the invitation text" value={c.imageUrl} onChange={url => set({ ...c, imageUrl: url ?? "" })} optional={false} />
  </div>;
}
function CountdownEditor({ c, set }: { c: { targetDate: string; label: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.g2}>
    <Field label="Label"><input style={ed.inp} placeholder="Countdown to the big day" value={c.label} onChange={e => set({ ...c, label: e.target.value })} /></Field>
    <Field label="Default date (optional)"><input style={ed.inp} type="datetime-local" value={c.targetDate} onChange={e => set({ ...c, targetDate: e.target.value })} /></Field>
  </div>;
}
function DetailsEditor({ c, set }: { c: { items: DetailItem[]; photoItems?: PhotoDetailItem[] }; set: (v: SectionContent) => void }) {
  const update = (i: number, p: Partial<DetailItem>) => set({ ...c, items: c.items.map((it, idx) => idx === i ? { ...it, ...p } : it) });
  return <div style={ed.col}>
    {c.items.map((it, i) => (
      <div key={i} style={ed.itemRow}>
        <input style={{ ...ed.inp, width: 48, textAlign: "center", padding: "0.375rem" }} value={it.icon} onChange={e => update(i, { icon: e.target.value })} />
        <input style={{ ...ed.inp, flex: 1 }} placeholder="Label" value={it.label} onChange={e => update(i, { label: e.target.value })} />
        <input style={{ ...ed.inp, flex: 2 }} placeholder="Value" value={it.value} onChange={e => update(i, { value: e.target.value })} />
        <button type="button" style={ed.rmBtn} onClick={() => set({ ...c, items: c.items.filter((_, idx) => idx !== i) })}>✕</button>
      </div>
    ))}
    <button type="button" style={ed.addBtn} onClick={() => set({ ...c, items: [...c.items, { icon: "📌", label: "", value: "" }] })}>+ Add row</button>
  </div>;
}
function GalleryEditor({ c, set }: { c: { layout: "grid" | "masonry" | "slideshow" }; set: (v: SectionContent) => void }) {
  return <div style={{ display: "flex", gap: "0.5rem" }}>
    {(["grid", "masonry", "slideshow"] as const).map(l => (
      <button key={l} type="button" onClick={() => set({ layout: l })} style={{ ...ed.layoutBtn, ...(c.layout === l ? ed.layoutBtnOn : {}) }}>
        {l === "grid" ? "▦" : l === "masonry" ? "▤" : "▷"} {l.charAt(0).toUpperCase() + l.slice(1)}
      </button>
    ))}
  </div>;
}
function VideoEditor({ c, set }: { c: { url: string; caption: string; thumbnailUrl?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.col}>
    <Field label="Video URL (optional)"><input style={ed.inp} placeholder="https://youtube.com/…" value={c.url} onChange={e => set({ ...c, url: e.target.value })} /></Field>
    <Field label="Default caption"><input style={ed.inp} placeholder="Watch our story…" value={c.caption} onChange={e => set({ ...c, caption: e.target.value })} /></Field>
  </div>;
}
function WishingEditor({ c, set }: { c: { placeholder: string }; set: (v: SectionContent) => void }) {
  return <Field label="Input placeholder">
    <textarea style={{ ...ed.inp, minHeight: 60, resize: "vertical" }} value={c.placeholder} onChange={e => set({ ...c, placeholder: e.target.value })} />
  </Field>;
}
// Normalize legacy single-QR content into the new items list.
function khqrItemsOf(c: { items?: KhqrItem[]; recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string }): KhqrItem[] {
  if (Array.isArray(c.items)) return c.items;
  if (c.qrImageUrl) return [{ currency: c.currency || "USD", qrImageUrl: c.qrImageUrl, recipientName: c.recipientName || "", amount: c.amount || "" }];
  return [];
}

function KhqrEditor({ c, set }: { c: { items?: KhqrItem[]; title?: string; recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string }; set: (v: SectionContent) => void }) {
  const items = khqrItemsOf(c);
  const update = (i: number, patch: Partial<KhqrItem>) =>
    set({ title: c.title, items: items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
  const remove = (i: number) => set({ title: c.title, items: items.filter((_, idx) => idx !== i) });
  const add = () => set({ title: c.title, items: [...items, { currency: "USD", qrImageUrl: "", recipientName: "", amount: "" }] });

  return <div style={ed.col}>
    {items.length === 0 && <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--c-muted)" }}>Add one or more payment QR codes — e.g. one for USD and one for KHR.</p>}
    {items.map((item, i) => (
      <div key={i} style={{ border: "1px solid var(--c-border)", borderRadius: 8, padding: "0.75rem", background: "var(--c-surface-2)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-muted)" }}>QR {i + 1}</span>
          <button type="button" style={ed.rmBtn} onClick={() => remove(i)}>✕ Remove</button>
        </div>
        <SectionImagePicker label="QR code image" value={item.qrImageUrl} onChange={url => update(i, { qrImageUrl: url ?? "" })} optional={false} />
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          <Field label="Currency"><input style={{ ...ed.inp, width: 90 }} placeholder="USD" value={item.currency} onChange={e => update(i, { currency: e.target.value })} /></Field>
          <Field label="Recipient name" style={{ flex: 2 }}><input style={ed.inp} placeholder="Sophea & Dara" value={item.recipientName} onChange={e => update(i, { recipientName: e.target.value })} /></Field>
          <Field label="Amount"><input style={ed.inp} placeholder="0" value={item.amount} onChange={e => update(i, { amount: e.target.value })} /></Field>
        </div>
      </div>
    ))}
    <button type="button" style={ed.addBtn} onClick={add}>+ Add QR</button>
  </div>;
}
function PhotoCoverEditor({ c, set }: { c: { heading: string; subheading: string; imageUrl?: string; logoUrl?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.col}>
    <SectionImagePicker label="Cover photo — also the landing-page background" value={c.imageUrl} onChange={url => set({ ...c, imageUrl: url })} />
    <SectionImagePicker label="Monogram / logo (optional)" value={c.logoUrl} onChange={url => set({ ...c, logoUrl: url })} />
    <div style={ed.g2}>
      <Field label="Heading"><input style={ed.inp} placeholder="We're Getting Married" value={c.heading} onChange={e => set({ ...c, heading: e.target.value })} /></Field>
      <Field label="Subheading"><input style={ed.inp} placeholder="Join us for our special day" value={c.subheading} onChange={e => set({ ...c, subheading: e.target.value })} /></Field>
    </div>
  </div>;
}
function PhotoDetailsEditor({ c, set }: { c: { items: DetailItem[]; photoItems?: PhotoDetailItem[] }; set: (v: SectionContent) => void }) {
  const photoItems = c.photoItems ?? [];
  const updateItem = (i: number, patch: Partial<PhotoDetailItem>) =>
    set({ ...c, photoItems: photoItems.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
  return <div style={ed.col}>
    {photoItems.length === 0 && <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--c-muted)" }}>Add photo agenda items — each will display as an image card.</p>}
    {photoItems.map((item, i) => (
      <div key={i} style={{ border: "1px solid var(--c-border)", borderRadius: 8, padding: "0.75rem", background: "var(--c-surface-2)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-muted)" }}>Item {i + 1}</span>
          <button type="button" style={ed.rmBtn} onClick={() => set({ ...c, photoItems: photoItems.filter((_, idx) => idx !== i) })}>✕ Remove</button>
        </div>
        <SectionImagePicker label="Image" value={item.imageUrl} onChange={url => updateItem(i, { imageUrl: url ?? "" })} optional={false} />
        <Field label="Caption"><input style={ed.inp} placeholder="e.g. Ceremony at 10:00 AM" value={item.caption} onChange={e => updateItem(i, { caption: e.target.value })} /></Field>
      </div>
    ))}
    <button type="button" style={ed.addBtn} onClick={() => set({ ...c, photoItems: [...photoItems, { imageUrl: "", caption: "" }] })}>+ Add photo item</button>
  </div>;
}
function PhotoVideoEditor({ c, set }: { c: { url: string; caption: string; thumbnailUrl?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.col}>
    <SectionImagePicker label="Thumbnail / poster image" value={c.thumbnailUrl} onChange={url => set({ ...c, thumbnailUrl: url })} />
    <Field label="Video URL (optional)"><input style={ed.inp} placeholder="https://youtube.com/…" value={c.url} onChange={e => set({ ...c, url: e.target.value })} /></Field>
    <Field label="Caption"><input style={ed.inp} placeholder="Watch our story…" value={c.caption} onChange={e => set({ ...c, caption: e.target.value })} /></Field>
  </div>;
}
function PhotoWishingEditor({ c, set }: { c: { placeholder: string; backgroundImageUrl?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.col}>
    <SectionImagePicker label="Section background image" value={c.backgroundImageUrl} onChange={url => set({ ...c, backgroundImageUrl: url })} />
    <Field label="Input placeholder"><textarea style={{ ...ed.inp, minHeight: 60, resize: "vertical" }} value={c.placeholder} onChange={e => set({ ...c, placeholder: e.target.value })} /></Field>
  </div>;
}

type EditorProps = { content: SectionContent; onChange: (c: SectionContent) => void };
function getEditor(type: SectionType, contentType: ContentType): (p: EditorProps) => React.ReactElement {
  if (contentType === "photo") {
    const photoEditors: Partial<Record<SectionType, (p: EditorProps) => React.ReactElement>> = {
      cover:   ({ content, onChange }) => <PhotoCoverEditor   c={content as never} set={onChange} />,
      wording: ({ content, onChange }) => <PhotoWordingEditor c={content as never} set={onChange} />,
      details: ({ content, onChange }) => <PhotoDetailsEditor c={content as never} set={onChange} />,
      video:   ({ content, onChange }) => <PhotoVideoEditor   c={content as never} set={onChange} />,
      wishing: ({ content, onChange }) => <PhotoWishingEditor c={content as never} set={onChange} />,
    };
    if (photoEditors[type]) return photoEditors[type]!;
  }
  const textEditors: Record<SectionType, (p: EditorProps) => React.ReactElement> = {
    cover:     ({ content, onChange }) => <CoverEditor     c={content as never} set={onChange} />,
    wording:   ({ content, onChange }) => <WordingEditor   c={content as never} set={onChange} />,
    countdown: ({ content, onChange }) => <CountdownEditor c={content as never} set={onChange} />,
    details:   ({ content, onChange }) => <DetailsEditor   c={content as never} set={onChange} />,
    gallery:   ({ content, onChange }) => <GalleryEditor   c={content as never} set={onChange} />,
    video:     ({ content, onChange }) => <VideoEditor     c={content as never} set={onChange} />,
    wishing:   ({ content, onChange }) => <WishingEditor   c={content as never} set={onChange} />,
    khqr:      ({ content, onChange }) => <KhqrEditor      c={content as never} set={onChange} />,
  };
  return textEditors[type];
}

const ed = {
  col:      { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  g2:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" },
  inp:      { padding: "0.4rem 0.625rem", border: "1px solid var(--c-border)", background: "var(--c-surface)", color: "var(--c-text)", borderRadius: 6, fontSize: "0.875rem", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
  sel:      { padding: "0.4rem 0.625rem", border: "1px solid var(--c-border)", background: "var(--c-surface)", color: "var(--c-text)", borderRadius: 6, fontSize: "0.875rem", width: "100%", fontFamily: "inherit" },
  lbl:      { fontSize: "0.75rem", fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  itemRow:  { display: "flex", gap: "0.5rem", alignItems: "center" },
  rmBtn:    { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8125rem", padding: "0.25rem", flexShrink: 0 },
  addBtn:   { padding: "0.375rem 0.75rem", background: "transparent", border: "1px dashed var(--c-border)", borderRadius: 6, cursor: "pointer", fontSize: "0.8125rem", color: "var(--c-muted)", alignSelf: "flex-start" as const },
  layoutBtn:  { padding: "0.4rem 0.875rem", border: "2px solid var(--c-border)", borderRadius: 6, background: "var(--c-surface)", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-muted)" },
  layoutBtnOn:{ borderColor: "var(--c-accent)", background: "var(--c-accent-soft)", color: "var(--c-accent)" },
} as const;

// ── Section accordion row ─────────────────────────────────────────────────────

function SectionRow({ sec, contentType, onChange }: {
  sec: WizardSection; contentType: ContentType; onChange: (p: Partial<WizardSection>) => void;
}) {
  const meta = SECTION_META[sec.type];
  const isCountdownOverride = contentType === "photo" && sec.type === "countdown";
  return (
    <div style={{ ...sr.wrap, ...(sec.included ? sr.wrapOn : {}) }}>
      <div style={sr.header}>
        <span style={sr.icon}>{meta.icon}</span>
        <div style={sr.info}>
          <div style={sr.lbl}>{meta.label}</div>
          <div style={sr.desc}>{meta.desc}{isCountdownOverride && <span style={{ color: "var(--c-muted)", fontStyle: "italic" }}> · text-only</span>}</div>
        </div>
        {meta.locked
          ? <span style={sr.badge}>Required</span>
          : <div role="switch" aria-checked={sec.included} onClick={() => onChange({ included: !sec.included })}
              style={{ ...t.pill, ...(sec.included ? t.pillOn : t.pillOff), cursor: "pointer" }}>
              <div style={{ ...t.knob, transform: sec.included ? "translateX(18px)" : "translateX(2px)" }} />
            </div>
        }
      </div>
      {sec.included && (
        <div style={sr.editor}>
          {sec.type !== "cover" && (
            <div style={{ marginBottom: "0.875rem", paddingBottom: "0.875rem", borderBottom: "1px solid var(--c-border)" }}>
              <Toggle
                on={!(sec.content as { hideTitle?: boolean }).hideTitle}
                onChange={(v) => onChange({ content: { ...sec.content, hideTitle: !v } as SectionContent })}
                label="Show section title"
                sub="The icon + label header shown above this section"
              />
            </div>
          )}
          {getEditor(sec.type, contentType)({ content: sec.content, onChange: (content) => onChange({ content }) })}
        </div>
      )}
    </div>
  );
}
const sr = {
  wrap:   { border: "1.5px solid var(--c-border)", borderRadius: 10, overflow: "hidden", transition: "border-color 0.15s" },
  wrapOn: { borderColor: "var(--c-accent)" },
  header: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: "var(--c-surface-2)" },
  icon:   { fontSize: "1.375rem", flexShrink: 0 },
  info:   { flex: 1, minWidth: 0 },
  lbl:    { fontSize: "0.9375rem", fontWeight: 600, color: "var(--c-text)" },
  desc:   { fontSize: "0.8125rem", color: "var(--c-muted)", marginTop: 1 },
  badge:  { fontSize: "0.6875rem", fontWeight: 600, color: "var(--c-accent)", background: "var(--c-accent-soft)", borderRadius: 4, padding: "0.15rem 0.5rem", whiteSpace: "nowrap" as const },
  editor: { padding: "0.875rem 1rem", borderTop: "1px solid var(--c-border)", background: "var(--c-surface)" },
} as const;

// ── Overlay button card ───────────────────────────────────────────────────────

function OverlayCard({ icon, label, desc, enabled, onToggle, children }: {
  icon: string; label: string; desc: string; enabled: boolean; onToggle: () => void; children?: React.ReactNode;
}) {
  return (
    <div style={{ ...ov.card, ...(enabled ? ov.cardOn : {}) }}>
      <div style={ov.header}>
        <span style={ov.icon}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={ov.lbl}>{label}</div>
          <div style={ov.desc}>{desc}</div>
        </div>
        <div role="switch" aria-checked={enabled} onClick={onToggle} style={{ ...t.pill, ...(enabled ? t.pillOn : t.pillOff), cursor: "pointer" }}>
          <div style={{ ...t.knob, transform: enabled ? "translateX(18px)" : "translateX(2px)" }} />
        </div>
      </div>
      {enabled && children && <div style={ov.body}>{children}</div>}
    </div>
  );
}
const ov = {
  card:   { border: "1.5px solid var(--c-border)", borderRadius: 10, overflow: "hidden", transition: "border-color 0.15s" },
  cardOn: { borderColor: "var(--c-accent)" },
  header: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: "var(--c-surface-2)" },
  icon:   { fontSize: "1.25rem", flexShrink: 0 },
  lbl:    { fontSize: "0.9375rem", fontWeight: 600, color: "var(--c-text)" },
  desc:   { fontSize: "0.8125rem", color: "var(--c-muted)", marginTop: 1 },
  body:   { padding: "0.875rem 1rem", borderTop: "1px solid var(--c-border)", background: "var(--c-surface)", display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
} as const;

// ── Color scheme editor ───────────────────────────────────────────────────────

const COLOR_ROLES: { key: keyof ColorScheme; label: string; hint: string }[] = [
  { key: "title",    label: "Title",          hint: "Cover heading & countdown digits" },
  { key: "subtitle", label: "Subtitle",       hint: "Subheading beneath the title" },
  { key: "body",     label: "Body",           hint: "Detail values, captions, wishes" },
  { key: "header",   label: "Section header", hint: "Labels — DETAILS, COUNTDOWN…" },
  { key: "accent",   label: "Accent",         hint: "Buttons, borders, dividers" },
  { key: "muted",    label: "Muted",          hint: "Dates, venue, dimmed text" },
];

function ColorSchemeEditor({ content, gate, onContent, onGate }: {
  content: ColorScheme; gate: ColorScheme;
  onContent: (s: ColorScheme) => void; onGate: (s: ColorScheme) => void;
}) {
  const matchName = (s: ColorScheme) =>
    COLOR_PRESETS.find((p) => p.accent === s.accent && p.title === s.title && p.body === s.body)?.name;

  function applyPreset(preset: ColorPreset) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name: _n, ...scheme } = preset;
    onContent(scheme);
    onGate(scheme);
  }

  const activePreset = matchName(content) === matchName(gate) ? matchName(content) : undefined;

  return (
    <Collapsible title="Color Theme">

      {/* Preset palettes — applies to both at once */}
      <div style={csx.paletteGrid}>
        {COLOR_PRESETS.map((preset) => {
          const active = activePreset === preset.name;
          return (
            <button key={preset.name} type="button" onClick={() => applyPreset(preset)}
              style={{ ...csx.paletteCard, ...(active ? csx.paletteCardOn : {}) }}>
              <div style={csx.paletteSwatch}>
                <span style={{ color: preset.title, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "1.1rem", lineHeight: 1 }}>Aa</span>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: preset.accent, border: "1px solid rgba(255,255,255,0.35)", flexShrink: 0 }} />
              </div>
              <div style={csx.paletteName}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preset.name}</span>
                {active && <span style={{ color: "var(--c-accent)", fontWeight: 700 }}>✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Side-by-side custom color pickers — always visible */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginTop: "0.75rem" }}>
        {([
          ["Content Sections", content, onContent] as const,
          ["Landing Page",     gate,    onGate]    as const,
        ]).map(([groupLabel, scheme, onChange]) => (
          <div key={groupLabel}>
            <div style={csx.groupLabel}>{groupLabel}</div>
            <div style={csx.roleList}>
              {COLOR_ROLES.map(({ key, label }) => (
                <label key={key} style={csx.roleRow}>
                  <span style={{ ...csx.roleSwatch, background: toHex(scheme[key]) }}>
                    <input type="color" value={toHex(scheme[key])}
                      onChange={(e) => onChange({ ...scheme, [key]: e.target.value })}
                      style={csx.roleColorInput} />
                  </span>
                  <span style={csx.roleLabel}>{label}</span>
                  <span style={csx.roleHex}>{toHex(scheme[key])}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Collapsible>
  );
}

const csx = {
  paletteGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" },
  paletteCard:   { display: "flex", flexDirection: "column" as const, gap: "0.3rem", padding: "0.35rem", border: "2px solid var(--c-border)", borderRadius: 10, background: "var(--c-surface-2)", cursor: "pointer" },
  paletteCardOn: { borderColor: "var(--c-accent)", background: "var(--c-accent-soft)" },
  paletteSwatch: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", height: 40, borderRadius: 7, background: "linear-gradient(135deg, #1b1b22 0%, #2c2c36 100%)" },
  paletteName:   { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem", fontSize: "0.625rem", fontWeight: 600, color: "var(--c-text)" },
  groupLabel:    { fontSize: "0.6875rem", fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.4rem" },
  roleList:      { display: "flex", flexDirection: "column" as const, gap: "0.3rem" },
  roleRow:       { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.5rem", borderRadius: 7, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", cursor: "pointer" },
  roleSwatch:    { position: "relative" as const, width: 26, height: 26, borderRadius: 6, border: "1px solid var(--c-border)", flexShrink: 0, overflow: "hidden" as const },
  roleColorInput:{ position: "absolute" as const, inset: 0, width: "150%", height: "150%", top: "-25%", left: "-25%", opacity: 0, border: "none", padding: 0, cursor: "pointer" },
  roleLabel:     { flex: 1, fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-text)" },
  roleHex:       { fontSize: "0.6875rem", fontFamily: "monospace", color: "var(--c-muted)", textTransform: "uppercase" as const, flexShrink: 0 },
} as const;

// ── Font picker ───────────────────────────────────────────────────────────────

function FontSelect({ label, options, value, onChange }: {
  label: string; options: FontOption[]; value: string; onChange: (stack: string) => void;
}) {
  return (
    <div>
      <label style={ed.lbl}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...w.inp, fontFamily: value, marginTop: "0.375rem", fontSize: "0.9375rem", height: 36 }}
      >
        {options.map((opt) => (
          <option key={opt.label} value={opt.stack}>{opt.label}</option>
        ))}
      </select>
      <div style={{ marginTop: "0.3rem", fontFamily: value, fontSize: "1rem", color: "var(--c-muted)", pointerEvents: "none" }}>
        The quick brown fox
      </div>
    </div>
  );
}

function SizeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
        <span style={ed.lbl}>{label}</span>
        <span style={{ fontSize: "0.6875rem", color: "var(--c-muted)", fontFamily: "monospace" }}>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min={0.8} max={1.4} step={0.05} value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: "var(--c-accent)" }}
      />
    </div>
  );
}

function FontPicker({ fonts, onChange }: { fonts: EventFonts; onChange: (f: EventFonts) => void }) {
  return (
    <Collapsible title="Typography">
      <p style={w.note}>Choose fonts and sizes for titles and body text. Each option is shown in its own font; the preview updates live.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <div>
          <FontSelect label="Heading font" options={HEADING_FONTS} value={fonts.heading} onChange={(s) => onChange({ ...fonts, heading: s })} />
          <SizeSlider label="Heading size" value={fonts.headingScale ?? 1} onChange={(v) => onChange({ ...fonts, headingScale: v })} />
        </div>
        <div>
          <FontSelect label="Body font" options={BODY_FONTS} value={fonts.body} onChange={(s) => onChange({ ...fonts, body: s })} />
          <SizeSlider label="Body size" value={fonts.bodyScale ?? 1} onChange={(v) => onChange({ ...fonts, bodyScale: v })} />
        </div>
      </div>
    </Collapsible>
  );
}

// ── Main Wizard Component ─────────────────────────────────────────────────────

type WizardView = "setup" | "landing" | "sections" | "buttons" | "assets";

const TABS: { id: WizardView; label: string }[] = [
  { id: "setup",    label: "Setup" },
  { id: "landing",  label: "Landing" },
  { id: "sections", label: "Sections" },
  { id: "buttons",  label: "Buttons" },
  { id: "assets",   label: "Assets" },
];

const TAB_DESC: Record<WizardView, string> = {
  setup:    "Event name, date, venue and content style.",
  landing:  "The opening page — colors, fonts, background, monogram and opening animation.",
  sections: "Choose and edit the sections guests scroll through.",
  buttons:  "Floating action buttons (RSVP, map, music) and the scroll guide.",
  assets:   "Background, music and other media; copy your share link.",
};

interface Props {
  event: EventData;
  invitation: InvitationData | null;
}

export function EventWizard({ event, invitation }: Props) {
  const router = useRouter();
  // The editor follows the live preview: "landing" controls show when the preview
  // is on the Gate; everything else shows the sections view. Buttons & Assets get
  // their own tabs.
  const [view, setView] = useState<WizardView>("setup");

  // ── Event identity state
  const [eventTitle, setEventTitle]     = useState(event.title);
  const [eventType, setEventType]       = useState(event.eventType);
  const [eventDate, setEventDate]       = useState(toDateInputValue(event.eventDate));
  const [venueName, setVenueName]       = useState(event.venueName ?? "");
  const [venueMapUrl, setVenueMapUrl]   = useState(event.venueMapUrl ?? "");

  // ── Invitation design state
  const [contentType, setContentType]   = useState<ContentType>((invitation?.contentType as ContentType) ?? "photo");
  const [sections, setSections]         = useState<WizardSection[]>(parseSections(invitation?.defaultSections));
  const [overlay, setOverlay]           = useState<OverlayConfig>(parseOverlay(invitation?.overlayConfig));
  const [mapImageFile, setMapImageFile]     = useState<File | null>(null);
  const [guestFrameFile, setGuestFrameFile] = useState<File | null>(null);

  // ── Asset files
  const [bgAssetType, setBgAssetType] = useState<BgAssetType>(invitation?.backgroundVideoUrl ? "video" : "image");
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgVideoFile, setBgVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile]     = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [musicFile, setMusicFile]     = useState<File | null>(null);

  // ── Gallery photos (loaded from DB, managed immediately — no save needed)
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; sortOrder: number }>>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/admin/events/${event.id}/photos`)
      .then(r => r.json())
      .then((d: { photos?: Array<{ id: string; url: string; sortOrder: number }> }) => {
        setPhotos(d.photos ?? []);
      })
      .catch(() => {});
  }, [event.id]);

  async function uploadPhoto(file: File) {
    setPhotoUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", "gallery");
      const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!up.ok) throw new Error("Upload failed");
      const { url } = await up.json() as { url: string };
      const res = await fetch(`/api/admin/events/${event.id}/photos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json() as { photo?: { id: string; url: string; sortOrder: number } };
      if (data.photo) {
        setPhotos(prev => [...prev, data.photo!]);
      }
    } catch { /* ignore */ }
    finally { setPhotoUploading(false); }
  }

  async function deletePhoto(photoId: string) {
    await fetch(`/api/admin/events/${event.id}/photos?photoId=${photoId}`, { method: "DELETE" });
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }

  // ── Save state
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [isDirty, setIsDirty]     = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  // Track whether an invitation record exists in DB (false = first save hasn't happened yet)
  const [hasInvitation, setHasInvitation] = useState(!!invitation);

  const updateSection = useCallback((type: SectionType, patch: Partial<WizardSection>) => {
    setSections(prev => prev.map(s => s.type === type ? { ...s, ...patch } : s));
  }, []);
  const patchOverlay = (patch: Partial<OverlayConfig>) => setOverlay(prev => ({ ...prev, ...patch }));

  // Track unsaved changes — any state update after first render = dirty
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setIsDirty(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTitle, eventType, eventDate, venueName, venueMapUrl, contentType, sections, overlay]);

  // ── Full save (files + publish)
  async function upload(file: File, folder: string) {
    const fd = new FormData(); fd.append("file", file); fd.append("folder", folder);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error(`Upload failed: ${file.name}`);
    return (await res.json() as { url: string }).url;
  }

  async function handleSave(publish = false) {
    setError(""); setLoading(true);
    try {
      let mapImageUrl = overlay.map.imageUrl;
      if (mapImageFile) mapImageUrl = await upload(mapImageFile, "themes/map");

      const [bgImageUrl, bgVideoUrl, thumbUrl, previewUrl, musicUrl, guestFrameUrl] = await Promise.all([
        bgAssetType === "image" && bgImageFile ? upload(bgImageFile, "themes/backgrounds") : Promise.resolve(invitation?.backgroundUrl ?? null),
        bgAssetType === "video" && bgVideoFile ? upload(bgVideoFile, "themes/backgrounds/video") : Promise.resolve(invitation?.backgroundVideoUrl ?? null),
        thumbFile      ? upload(thumbFile,      "themes/thumbnails") : Promise.resolve(invitation?.thumbnailUrl ?? null),
        previewFile    ? upload(previewFile,    "themes/preview")    : Promise.resolve(invitation?.previewUrl ?? null),
        musicFile      ? upload(musicFile,      "themes/music")      : Promise.resolve(invitation?.musicUrl ?? null),
        guestFrameFile ? upload(guestFrameFile, "themes/frames")     : Promise.resolve(overlay.guestFrameUrl),
      ]);

      // Single source of truth for the cover image: the Cover section's uploaded
      // photo. Mirror it onto invitation.coverUrl so the landing-page gate
      // (InviteGate reads inv.coverUrl) shows it too.
      const coverSection = sections.find((s) => s.type === "cover");
      const coverUrl = (coverSection?.content as { imageUrl?: string })?.imageUrl ?? null;

      const finalOverlay: OverlayConfig = {
        ...overlay,
        guestFrameUrl,
        map: { ...overlay.map, imageUrl: mapImageUrl, url: overlay.map.inputType === "url" ? venueMapUrl : overlay.map.url },
      };

      const payload: Record<string, unknown> = {
        title: eventTitle.trim(), eventType, eventDate, venueName, venueMapUrl,
        contentType, defaultSections: sections, overlayConfig: finalOverlay,
        backgroundUrl: bgAssetType === "image" ? bgImageUrl : null,
        backgroundVideoUrl: bgAssetType === "video" ? bgVideoUrl : null,
        coverUrl, thumbnailUrl: thumbUrl, previewUrl, musicUrl,
      };
      if (publish) payload.isPublished = true;

      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Failed to save"); return; }

      setHasInvitation(true);
      setIsDirty(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      // The live preview renders from local state (instant), so no iframe reload
      // is needed. Refresh server data so the saved invitation prop is current.
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const shareUrl = invitation?.shareLink ?? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${event.slug}`;

  // The single cover image lives on the Cover section. Feed it to the preview's
  // gate (existingCoverUrl) so the landing page reflects it instantly.
  const coverImageUrl =
    (sections.find((s) => s.type === "cover")?.content as { imageUrl?: string })?.imageUrl ?? null;

  return (
    <>
    <style>{`
      .ev-wizard-row { display: flex; gap: 1.5rem; align-items: flex-start; }
      .ev-wizard-preview { width: 330px; flex-shrink: 0; position: sticky; top: 1rem; }
      @media (max-width: 960px) {
        .ev-wizard-row { flex-direction: column; }
        .ev-wizard-preview { width: 100% !important; position: static !important; display: flex; justify-content: center; }
      }
    `}</style>
    <div style={w.page}>
      {/* Tab bar — follows the live preview (Landing = Gate view) */}
      <div style={w.topBar}>
        <div style={w.tabRow}>
          {TABS.map((t) => {
            const active = view === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setView(t.id)}
                style={{ ...w.tab, ...(active ? w.tabActive : {}) }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Save status badge */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.375rem", minHeight: "1.25rem" }}>
          {justSaved && (
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: 4, background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac" }}>
              ✓ Saved
            </span>
          )}
          {isDirty && !justSaved && (
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: 4, background: "var(--c-surface-2)", color: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
              • Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* Tab orientation */}
      <div style={w.stepIntro}>
        <div style={w.stepIntroTitle}>{TABS.find((t) => t.id === view)?.label}</div>
        <p style={w.stepIntroDesc}>{TAB_DESC[view]}</p>
        {view === "sections" && <p style={w.stepIntroHint}>Tip: use <strong>⠿ Reorder</strong> in the preview to drag sections into order.</p>}
        {view === "landing" && <p style={w.stepIntroHint}>Tip: use <strong>✥ Move</strong> in the preview to drag the gate elements.</p>}
      </div>

      {/* Two-column layout: edit | preview */}
      <div className="ev-wizard-row">

        {/* Left: form */}
        <div style={w.editPane}>

          {/* Step 1 — Event Setup */}
          {view === "setup" && (
            <div style={w.col}>
              <div style={w.sectionCard}>
                <div style={w.sectionHead}>Event Identity</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                    <div style={w.field}>
                      <label style={w.flbl}>Event title <span style={{ color: "#dc2626" }}>*</span></label>
                      <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="e.g. Sophea & Dara's Wedding" style={w.inp} />
                    </div>
                    <div style={w.field}>
                      <label style={w.flbl}>Event type</label>
                      <select value={eventType} onChange={e => setEventType(e.target.value)} style={w.inp}>
                        {EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
                      </select>
                    </div>
                    <div style={w.field}>
                      <label style={w.flbl}>Event date</label>
                      <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={w.inp} />
                    </div>
                    <div style={w.field}>
                      <label style={w.flbl}>Venue name</label>
                      <input value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="Hall / venue name" style={w.inp} />
                    </div>
                  </div>
                  <p style={{ ...w.note, fontSize: "0.8125rem" }}>The venue map link is set under <strong>Overlays → Map button</strong>.</p>
                </div>
              </div>

              <div style={w.sectionCard}>
                <div style={w.sectionHead}>Content Style</div>
                <div style={w.typeGrid}>
                  {(["photo", "text"] as ContentType[]).map(type => (
                    <button key={type} type="button" onClick={() => setContentType(type)}
                      style={{ ...w.typeCard, ...(contentType === type ? w.typeCardOn : {}) }}>
                      <span style={{ fontSize: "1.75rem" }}>{type === "photo" ? "🖼" : "✏️"}</span>
                      <span style={w.typeTitle}>{type === "photo" ? "Photo-first" : "Text-first"}</span>
                      <span style={w.typeDesc}>
                        {type === "photo" ? "Sections driven by uploaded images — agenda items and covers are photo-based"
                          : "Sections driven by text & typography — fill in labels, headings, and details"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Landing — styling for the opening page (preview shows the Gate) */}
          {view === "landing" && (
            <div style={w.col}>
              <FontPicker fonts={overlay.fonts} onChange={(f) => patchOverlay({ fonts: f })} />

              <ColorSchemeEditor
                content={overlay.colorScheme}
                gate={overlay.gateColorScheme}
                onContent={(s) => patchOverlay({ colorScheme: s })}
                onGate={(s) => patchOverlay({ gateColorScheme: s })}
              />

              <Collapsible title="Background & Overlay">

                <div style={{ ...w.field }}>
                  <label style={w.flbl}>Landing page content position</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {([["top", "⬆ Top"], ["center", "⬍ Center"], ["bottom", "⬇ Bottom"]] as const).map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => patchOverlay({ gatePosition: val })}
                        style={{ ...ed.layoutBtn, ...(overlay.gatePosition === val ? ed.layoutBtnOn : {}), flex: 1 }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                  {([
                    ["Landing page blur", "backgroundBlur"] as const,
                    ["Sections blur",     "sectionBlur"]    as const,
                  ]).map(([lbl, key]) => (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span style={w.flbl}>{lbl}</span>
                        <input
                          type="number" min={0} max={40} step={1}
                          value={overlay[key]}
                          onChange={(e) => patchOverlay({ [key]: Math.max(0, Math.min(40, +e.target.value || 0)) })}
                          style={{ width: 44, padding: "0.125rem 0.25rem", border: "1px solid var(--c-border)", borderRadius: 5, background: "var(--c-surface)", color: "var(--c-text)", fontSize: "0.75rem", textAlign: "center" }}
                        />
                      </div>
                      <input type="range" min={0} max={40} step={1} value={overlay[key]}
                        onChange={(e) => patchOverlay({ [key]: +e.target.value })}
                        style={{ width: "100%", accentColor: "var(--c-accent)" }} />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "0.875rem" }}>
                  <Toggle
                    on={overlay.sectionOverlay.enabled}
                    onChange={(v) => patchOverlay({ sectionOverlay: { ...overlay.sectionOverlay, enabled: v } })}
                    label="Section color overlay"
                    sub="Tint the content sections with a color layer"
                  />
                  {overlay.sectionOverlay.enabled && (
                    <div style={{ marginTop: "0.625rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--c-text)" }}>
                        Color
                        <input type="color" value={overlay.sectionOverlay.color}
                          onChange={(e) => patchOverlay({ sectionOverlay: { ...overlay.sectionOverlay, color: e.target.value } })}
                          style={{ width: 36, height: 28, border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                      </label>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.15rem" }}>
                          <span style={{ fontSize: "0.8125rem", color: "var(--c-text)" }}>Opacity</span>
                          <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "var(--c-muted)" }}>{Math.round(overlay.sectionOverlay.opacity * 100)}%</span>
                        </div>
                        <input type="range" min={0} max={0.8} step={0.05} value={overlay.sectionOverlay.opacity}
                          onChange={(e) => patchOverlay({ sectionOverlay: { ...overlay.sectionOverlay, opacity: +e.target.value } })}
                          style={{ width: "100%", accentColor: "var(--c-accent)" }} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "0.875rem" }}>
                  <Toggle
                    on={overlay.gateOverlay.enabled}
                    onChange={(v) => patchOverlay({ gateOverlay: { ...overlay.gateOverlay, enabled: v } })}
                    label="Landing color overlay"
                    sub="Tint the landing page (gate) with a color layer over the background"
                  />
                  {overlay.gateOverlay.enabled && (
                    <div style={{ marginTop: "0.625rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--c-text)" }}>
                        Color
                        <input type="color" value={overlay.gateOverlay.color}
                          onChange={(e) => patchOverlay({ gateOverlay: { ...overlay.gateOverlay, color: e.target.value } })}
                          style={{ width: 36, height: 28, border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                      </label>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.15rem" }}>
                          <span style={{ fontSize: "0.8125rem", color: "var(--c-text)" }}>Opacity</span>
                          <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "var(--c-muted)" }}>{Math.round(overlay.gateOverlay.opacity * 100)}%</span>
                        </div>
                        <input type="range" min={0} max={0.9} step={0.05} value={overlay.gateOverlay.opacity}
                          onChange={(e) => patchOverlay({ gateOverlay: { ...overlay.gateOverlay, opacity: +e.target.value } })}
                          style={{ width: "100%", accentColor: "var(--c-accent)" }} />
                      </div>
                    </div>
                  )}
                </div>
              </Collapsible>

              {/* Opening animation card */}
              <Collapsible title="Opening animation">
                <p style={w.note}>How the invitation reveals when the guest taps Open.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {([
                    ["fade",     "Fade & zoom",        "Gate fades and zooms out"],
                    ["envelope", "Envelope / ticket",  "Folds open from the top"],
                    ["curtain",  "Curtain split",      "Two halves part to the sides"],
                    ["slideUp",  "Slide up",           "Gate slides up out of view"],
                  ] as const).map(([val, title, desc]) => (
                    <button key={val} type="button" onClick={() => patchOverlay({ revealStyle: val })}
                      style={{ ...w.typeCard, ...(overlay.revealStyle === val ? w.typeCardOn : {}) }}>
                      <span style={w.typeTitle}>{title}</span>
                      <span style={w.typeDesc}>{desc}</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: "0.875rem" }}>
                  <Toggle
                    on={overlay.keepCoverAfterOpen}
                    onChange={(v) => patchOverlay({ keepCoverAfterOpen: v })}
                    label="Show cover after opening"
                    sub="On: the cover stays as the first screen (scroll-based). Off: jump straight to the content sections."
                  />
                </div>
              </Collapsible>

              {/* Guest Greeting & Monogram card */}
              <Collapsible title="Guest Greeting & Monogram">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <Toggle
                    on={overlay.showGuestName}
                    onChange={(v) => patchOverlay({ showGuestName: v })}
                    label="Show guest name on landing page"
                    sub="Displays the personalised guest name below the event title"
                  />
                  <Toggle
                    on={overlay.monogram.gate}
                    onChange={(v) => patchOverlay({ monogram: { ...overlay.monogram, gate: v } })}
                    label="Show monogram on landing page"
                    sub="Circular cover photo shown at the top of the gate"
                  />
                  <Toggle
                    on={overlay.monogram.sections}
                    onChange={(v) => patchOverlay({ monogram: { ...overlay.monogram, sections: v } })}
                    label="Show monogram in sections"
                    sub="Circular photo shown at the top of the cover section"
                  />
                  <div style={{ marginTop: "0.375rem" }}>
                    <FilePicker
                      label="Guest name frame image"
                      hint="Decorative frame behind the guest name — spans the full screen width at its natural height (PNG with a transparent center recommended)"
                      accept="image/png,image/webp"
                      file={guestFrameFile}
                      setFile={setGuestFrameFile}
                      preview
                    />
                    {overlay.guestFrameUrl && !guestFrameFile && (
                      <p style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginTop: "0.25rem" }}>
                        Current frame: <a href={overlay.guestFrameUrl} target="_blank" rel="noreferrer" style={{ color: "var(--c-accent)" }}>view</a>
                        {" "}&mdash;{" "}
                        <button type="button" onClick={() => patchOverlay({ guestFrameUrl: null })}
                          style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline", padding: 0 }}>
                          remove
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              </Collapsible>
            </div>
          )}

          {/* Step 2 — Sections */}
          {view === "sections" && (
            <div style={w.col}>
              <div style={w.modeBanner}>
                <span style={{ fontSize: "1rem" }}>{contentType === "photo" ? "🖼" : "✏️"}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--c-text)", fontWeight: 500 }}>
                  {contentType === "photo" ? "Photo-based: section content is image-driven." : "Text-based: section content is text-driven."}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {sections.map(sec => (
                  <SectionRow key={sec.type} sec={sec} contentType={contentType} onChange={p => updateSection(sec.type, p)} />
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Overlays */}
          {view === "buttons" && (
            <div style={w.col}>
              <p style={w.note}>Choose which floating buttons appear on the invitation page.</p>
              <div style={w.field}>
                <label style={w.flbl}>Button display style</label>
                <div style={w.typeGrid}>
                  {([
                    ["floating",  "Floating icons",   "Individual circular icons positioned over the page", "◉"],
                    ["bottomBar", "Bottom menu bar",  "Fixed tab bar at the bottom, like a mobile app",     "▬"],
                  ] as const).map(([val, title, desc, ico]) => (
                    <button key={val} type="button" onClick={() => patchOverlay({ style: val })}
                      style={{ ...w.typeCard, ...(overlay.style === val ? w.typeCardOn : {}) }}>
                      <span style={{ fontSize: "1.5rem" }}>{ico}</span>
                      <span style={w.typeTitle}>{title}</span>
                      <span style={w.typeDesc}>{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={w.sectionCard}>
                <div style={w.sectionHead}>Button colors</div>
                <p style={w.note}>Color of the floating action buttons (RSVP, map, music, gifts).</p>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.625rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--c-text)" }}>
                    Button background
                    <input type="color" value={toHex(overlay.actionButton.bg)}
                      onChange={(e) => patchOverlay({ actionButton: { ...overlay.actionButton, bg: e.target.value } })}
                      style={{ width: 36, height: 28, border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--c-text)" }}>
                    Icon color
                    <input type="color" value={toHex(overlay.actionButton.color)}
                      onChange={(e) => patchOverlay({ actionButton: { ...overlay.actionButton, color: e.target.value } })}
                      style={{ width: 36, height: 28, border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                  </label>
                </div>
              </div>

              <div style={w.sectionCard}>
                <div style={w.sectionHead}>Scroll guide</div>
                <Toggle
                  on={overlay.scrollGuide}
                  onChange={(v) => patchOverlay({ scrollGuide: v })}
                  label={'Show scroll guide hand'}
                  sub={'Animated hand + “Scroll to explore” hint shown once after the invitation opens'}
                />
              </div>

              <div style={w.sectionCard}>
                <div style={w.sectionHead}>RSVP button</div>
                <Toggle
                  on={overlay.showRsvp}
                  onChange={(v) => patchOverlay({ showRsvp: v })}
                  label={'Show RSVP button'}
                  sub={'Floating RSVP action button and RSVP form on the invitation page'}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <OverlayCard icon="🗺" label="Map button" desc="Opens a location map overlay when guests tap it"
                  enabled={overlay.map.enabled} onToggle={() => patchOverlay({ map: { ...overlay.map, enabled: !overlay.map.enabled } })}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    {(["url", "image"] as MapInputType[]).map(mt => (
                      <button key={mt} type="button" onClick={() => patchOverlay({ map: { ...overlay.map, inputType: mt } })}
                        style={{ ...ed.layoutBtn, ...(overlay.map.inputType === mt ? ed.layoutBtnOn : {}) }}>
                        {mt === "url" ? "🔗 Google Maps URL" : "🖼 Upload image"}
                      </button>
                    ))}
                  </div>
                  {overlay.map.inputType === "url"
                    ? <Field label="Venue map URL (Google Maps)">
                        <input style={ed.inp} placeholder="https://maps.google.com/…" value={venueMapUrl}
                          onChange={e => setVenueMapUrl(e.target.value)} />
                      </Field>
                    : <FilePicker label="Map image" hint="Upload a static map image shown in the overlay (≤ 10 MB)"
                        accept="image/jpeg,image/png,image/webp" file={mapImageFile} setFile={setMapImageFile} preview />
                  }
                </OverlayCard>
                <OverlayCard icon="🎵" label="Music toggle" desc="Pause / play button for the background music track"
                  enabled={overlay.music.enabled} onToggle={() => patchOverlay({ music: { enabled: !overlay.music.enabled } })} />
                <OverlayCard icon="⬆" label="Go to top" desc="Scroll-to-top button that appears as guests scroll down"
                  enabled={overlay.goToTop.enabled} onToggle={() => patchOverlay({ goToTop: { enabled: !overlay.goToTop.enabled } })} />
                <OverlayCard icon="🎁" label="Gifts (ABA)" desc="Quick-jump button that scrolls to the KHQR payment section"
                  enabled={overlay.gifts.enabled} onToggle={() => patchOverlay({ gifts: { enabled: !overlay.gifts.enabled } })} />
              </div>
            </div>
          )}

          {/* Step 4 — Assets */}
          {view === "assets" && (
            <div style={w.col}>
              <p style={w.note}>Upload the visual assets for this event. These appear directly on the live invitation.</p>
              <div style={w.field}>
                <label style={w.flbl}>Background asset type</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {(["image", "video"] as BgAssetType[]).map(bt => (
                    <button key={bt} type="button" onClick={() => setBgAssetType(bt)}
                      style={{ ...ed.layoutBtn, ...(bgAssetType === bt ? ed.layoutBtnOn : {}), padding: "0.5rem 1.25rem" }}>
                      {bt === "image" ? "🖼 Image" : "🎬 Video"}
                    </button>
                  ))}
                </div>
              </div>
              {bgAssetType === "image"
                ? <FilePicker label="Background image" hint="Full-page background shown behind all sections (≤ 10 MB)" accept="image/jpeg,image/png,image/webp" file={bgImageFile} setFile={setBgImageFile} preview />
                : <FilePicker label="Background video" hint="Motion video shown as background — MP4 or WebM (≤ 200 MB)" accept="video/mp4,video/webm,video/quicktime" file={bgVideoFile} setFile={setBgVideoFile} preview />
              }

              {/* Blur controls — shown next to the background upload for immediate feedback */}
              {bgAssetType === "image" && (
                <div style={w.sectionCard}>
                  <div style={w.sectionHead}>Background Blur</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                    {([
                      ["Landing page", "backgroundBlur"] as const,
                      ["Sections",     "sectionBlur"]    as const,
                    ]).map(([lbl, key]) => (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span style={w.flbl}>{lbl}</span>
                          <input
                            type="number" min={0} max={40} step={1}
                            value={overlay[key]}
                            onChange={(e) => patchOverlay({ [key]: Math.max(0, Math.min(40, +e.target.value || 0)) })}
                            style={{ width: 48, padding: "0.125rem 0.25rem", border: "1px solid var(--c-border)", borderRadius: 5, background: "var(--c-surface)", color: "var(--c-text)", fontSize: "0.75rem", textAlign: "center" }}
                          />
                        </div>
                        <input type="range" min={0} max={40} step={1} value={overlay[key]}
                          onChange={(e) => patchOverlay({ [key]: +e.target.value })}
                          style={{ width: "100%", accentColor: "var(--c-accent)" }} />
                        <div style={{ fontSize: "0.6875rem", color: "var(--c-muted)", marginTop: "0.125rem" }}>
                          {lbl === "Landing page" ? "Gate background blur" : "Sections background blur"} — {overlay[key]}px
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ ...w.note, marginTop: "0.625rem", marginBottom: 0 }}>
                    Switch the preview to <strong>Gate</strong> view to test landing page blur, <strong>Sections</strong> view for sections blur.
                  </p>
                </div>
              )}
              <FilePicker label="Thumbnail" hint="Small share-card preview image shown when the invite link is sent (≤ 5 MB)" accept="image/jpeg,image/png,image/webp" file={thumbFile} setFile={setThumbFile} preview />
              <FilePicker label="Background music" hint="Ambient audio played while guests browse — MP3, WAV, AAC (≤ 20 MB)" accept="audio/mpeg,audio/mp3,audio/wav,audio/aac,audio/ogg" file={musicFile} setFile={setMusicFile} />
              <p style={{ ...w.note, fontSize: "0.8125rem" }}>The cover image is set in <strong>Sections → Cover</strong>; it also becomes the landing-page background.</p>

              {/* Gallery photos — saved immediately, no Save button needed */}
              <div style={{ border: "1px solid var(--c-border)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", background: "var(--c-surface-2)" }}>
                  <div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--c-text)" }}>🖼 Gallery Photos</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--c-muted)", marginTop: 2 }}>Uploaded immediately — visible on invite right away</div>
                  </div>
                  <button
                    type="button"
                    disabled={photoUploading}
                    onClick={() => photoInputRef.current?.click()}
                    style={{ ...fp.pick, flexShrink: 0 }}
                  >
                    {photoUploading ? "Uploading…" : "+ Add photos"}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    style={{ display: "none" }}
                    onChange={async e => {
                      const files = Array.from(e.target.files ?? []);
                      for (const f of files) await uploadPhoto(f);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div style={{ padding: "0.875rem 1rem", background: "var(--c-surface)" }}>
                  {photos.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--c-muted)", textAlign: "center", padding: "1rem" }}>
                      No gallery photos yet. Upload some to show the gallery section.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: "0.5rem" }}>
                      {photos.map(p => (
                        <div key={p.id} style={{ position: "relative", paddingTop: "100%", borderRadius: 8, overflow: "hidden", background: "var(--c-surface-2)" }}>
                          <img src={p.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            onClick={() => deletePhoto(p.id)}
                            style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Existing assets preview */}
              {invitation && (invitation.backgroundUrl || invitation.backgroundVideoUrl || invitation.coverUrl || invitation.thumbnailUrl || invitation.musicUrl) && (
                <div style={{ border: "1px solid var(--c-border)", borderRadius: 10, padding: "0.875rem", background: "var(--c-surface-2)" }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-muted)", marginBottom: "0.625rem" }}>Current assets (kept unless replaced)</div>
                  <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                    {invitation.thumbnailUrl    && <AssetThumb label="Thumbnail"  url={invitation.thumbnailUrl} />}
                    {invitation.backgroundUrl   && <AssetThumb label="Background" url={invitation.backgroundUrl} />}
                    {invitation.backgroundVideoUrl && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                      <video src={invitation.backgroundVideoUrl} style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid var(--c-border)" }} muted />
                      <span style={{ fontSize: "0.6875rem", color: "var(--c-muted)" }}>Video BG</span>
                    </div>}
                    {invitation.musicUrl && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                      <div style={{ width: 64, height: 48, borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>🎵</div>
                      <span style={{ fontSize: "0.6875rem", color: "var(--c-muted)" }}>Music</span>
                    </div>}
                  </div>
                </div>
              )}

              {error && <p style={w.err}>{error}</p>}

              {/* Share link preview */}
              {invitation?.isPublished && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, fontSize: "0.8125rem" }}>
                  <span style={{ color: "#15803d", fontWeight: 600 }}>✓ Published</span>
                  <a href={shareUrl} target="_blank" rel="noreferrer" style={{ color: "#15803d", textDecoration: "underline", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl}</a>
                </div>
              )}
            </div>
          )}

          {error && <p style={w.err}>{error}</p>}

          {/* Save / publish — always available, no step gating */}
          <div style={w.footer}>
            <span style={{ fontSize: "0.8125rem", color: "var(--c-muted)" }}>
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                type="button"
                disabled={loading || !isDirty || !eventTitle.trim()}
                onClick={() => handleSave(false)}
                style={{ ...w.saveBtn, opacity: isDirty && eventTitle.trim() ? 1 : 0.45 }}
              >
                {loading ? "Saving…" : "Save"}
              </button>
              {!invitation?.isPublished && (
                <button type="button" disabled={loading} onClick={() => handleSave(true)} style={w.nextBtn}>
                  {loading ? "Publishing…" : "Save & Publish ↗"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: instant live preview — renders from local state, no DB writes */}
        <div className="ev-wizard-preview">
          <PhonePreview
            showGate={view === "landing"}
            onShowGateChange={(gate) => setView(gate ? "landing" : "sections")}
            contentType={contentType}
            sections={sections as unknown as PreviewSection[]}
            colorScheme={overlay.colorScheme}
            gateColorScheme={overlay.gateColorScheme}
            fonts={overlay.fonts}
            backgroundBlur={overlay.backgroundBlur}
            sectionBlur={overlay.sectionBlur}
            sectionOverlay={overlay.sectionOverlay}
            gateOverlay={overlay.gateOverlay}
            revealStyle={overlay.revealStyle}
            keepCoverAfterOpen={overlay.keepCoverAfterOpen}
            gatePosition={overlay.gatePosition}
            overlay={{
              style:   overlay.style,
              map:     { enabled: overlay.map.enabled },
              music:   { enabled: overlay.music.enabled },
              goToTop: { enabled: overlay.goToTop.enabled },
              gifts:   { enabled: overlay.gifts.enabled },
              actionButton: overlay.actionButton,
            }}
            bgImageFile={bgImageFile}
            bgVideoFile={bgVideoFile}
            bgAssetType={bgAssetType}
            coverFile={null}
            existingBgUrl={invitation?.backgroundUrl}
            existingBgVideoUrl={invitation?.backgroundVideoUrl}
            existingCoverUrl={coverImageUrl}
            eventTitle={eventTitle}
            eventDate={eventDate ? new Date(eventDate).toISOString() : null}
            venueName={venueName}
            venueMapUrl={venueMapUrl}
            showGuestName={overlay.showGuestName}
            showMonogram={overlay.monogram.gate}
            showMonogramInSections={overlay.monogram.sections}
            guestFrameUrl={overlay.guestFrameUrl}
            elementPositions={overlay.elementPositions}
            onPositionsChange={(pos) => patchOverlay({ elementPositions: pos })}
            onSectionsReorder={(newOrder) => {
              const includedTypes = newOrder.map((s) => s.type);
              const reordered = includedTypes
                .map((t) => sections.find((s) => s.type === t))
                .filter((s): s is WizardSection => !!s);
              const excluded = sections.filter((s) => !s.included);
              setSections([...reordered, ...excluded]);
            }}
          />
        </div>
      </div>
    </div>
    </>
  );
}


// ── Asset thumbnail helper ────────────────────────────────────────────────────
function AssetThumb({ label, url }: { label: string; url: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
      <img src={url} alt={label} style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid var(--c-border)" }} />
      <span style={{ fontSize: "0.6875rem", color: "var(--c-muted)" }}>{label}</span>
    </div>
  );
}

// ── Wizard styles ─────────────────────────────────────────────────────────────
const w = {
  page:        { display: "flex", flexDirection: "column" as const, gap: "1rem" },
  topBar:      { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "0.75rem 1rem" },
  tabRow:      { display: "flex", gap: "0.25rem", flexWrap: "wrap" as const },
  tab:         { flex: "1 1 auto", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-muted)", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit" },
  tabActive:   { background: "var(--c-accent)", color: "#fff", borderColor: "var(--c-accent)" },
  stepRow:     { display: "flex", alignItems: "center" },
  stepItem:    { display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 },
  dot:         { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 },
  dotActive:   { background: "var(--c-accent)", color: "#fff" },
  dotDone:     { background: "#16a34a", color: "#fff" },
  dotFuture:   { background: "var(--c-surface-2)", color: "var(--c-muted)", border: "1px solid var(--c-border)" },
  dotLbl:      { fontSize: "0.8125rem" },
  line:        { flex: 1, height: 1, background: "var(--c-border)", margin: "0 0.5rem" },
  trackWrap:   { height: 3, background: "var(--c-surface-2)", marginTop: "0.75rem", borderRadius: 2 },
  fill:        { height: "100%", background: "var(--c-accent)", borderRadius: 2, transition: "width 0.3s ease" },

  stepIntro:     { padding: "0 0.25rem" },
  stepIntroTitle:{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--c-text)" },
  stepIntroDesc: { margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--c-muted)", lineHeight: 1.5 },
  stepIntroHint: { margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--c-accent)", lineHeight: 1.5 },

  contentRow:  { display: "flex", gap: "1.5rem", alignItems: "flex-start" },
  editPane:    { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, gap: "1rem" },
  previewPane: { width: 330, flexShrink: 0, position: "sticky" as const, top: "1rem" },

  col:        { display: "flex", flexDirection: "column" as const, gap: "1rem" },
  sectionCard:{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 10, padding: "0.875rem" },
  sectionHead:{ fontSize: "0.75rem", fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.625rem" },
  note:       { margin: 0, fontSize: "0.875rem", color: "var(--c-muted)", lineHeight: 1.55 },
  modeBanner: { display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", background: "var(--c-accent-soft)", borderRadius: 8, border: "1px solid var(--c-border)" },

  field:      { display: "flex", flexDirection: "column" as const, gap: "0.375rem" },
  flbl:       { fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)" },
  inp:        { padding: "0.5625rem 0.875rem", border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", borderRadius: 8, fontSize: "0.9375rem", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },

  typeGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  typeCard:   { padding: "1rem", border: "2px solid var(--c-border)", borderRadius: 10, background: "var(--c-surface-2)", cursor: "pointer", textAlign: "left" as const, display: "flex", flexDirection: "column" as const, gap: "0.3rem" },
  typeCardOn: { borderColor: "var(--c-accent)", background: "var(--c-accent-soft)" },
  typeTitle:  { fontSize: "0.9375rem", fontWeight: 600, color: "var(--c-text)", display: "block" },
  typeDesc:   { fontSize: "0.8125rem", color: "var(--c-muted)", lineHeight: 1.4, display: "block" },

  footer:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12 },
  backBtn:    { padding: "0.5rem 1.125rem", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, cursor: "pointer", fontSize: "0.9375rem", color: "var(--c-text)" },
  saveBtn:    { padding: "0.5rem 1.25rem", background: "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: 8, cursor: "pointer", fontSize: "0.9375rem", fontWeight: 600, color: "var(--c-text)" },
  nextBtn:    { padding: "0.5rem 1.5rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.9375rem", fontWeight: 600 },
  err:        { margin: "0.75rem 0 0", padding: "0.625rem 0.875rem", background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: "0.875rem" },
} as const;
