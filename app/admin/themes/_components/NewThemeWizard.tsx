"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Theme } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionType = "cover" | "countdown" | "details" | "gallery" | "video" | "wishing" | "khqr";
type ContentType = "text" | "photo";
type BgAssetType = "image" | "video";
type OverlayStyle = "floating" | "bottomBar";
type MapInputType = "url" | "image";

interface DetailItem { icon: string; label: string; value: string }
interface PhotoDetailItem { imageUrl: string; caption: string }

type SectionContent =
  | { heading: string; subheading: string; imageUrl?: string }
  | { targetDate: string; label: string }
  | { items: DetailItem[]; photoItems?: PhotoDetailItem[] }
  | { layout: "grid" | "masonry" | "slideshow" }
  | { url: string; caption: string; thumbnailUrl?: string }
  | { placeholder: string; backgroundImageUrl?: string }
  | { recipientName: string; amount: string; currency: "KHR" | "USD"; qrImageUrl?: string };

interface WizardSection {
  type: SectionType;
  included: boolean;
  content: SectionContent;
}

interface ColorScheme { text: string; accent: string }

interface OverlayConfig {
  style: OverlayStyle;
  map:    { enabled: boolean; inputType: MapInputType; url: string; imageUrl: string };
  music:  { enabled: boolean };
  goToTop:{ enabled: boolean };
  gifts:  { enabled: boolean };
  colorScheme: ColorScheme;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const SECTION_META: Record<SectionType, { label: string; icon: string; desc: string; locked?: boolean }> = {
  cover:     { label: "Cover",         icon: "◈", desc: "Hero title, couple names & event date", locked: true },
  countdown: { label: "Countdown",     icon: "⏱", desc: "Live countdown timer to the event" },
  details:   { label: "Agenda / Details", icon: "📋", desc: "Venue, time, dress code & agenda items" },
  gallery:   { label: "Gallery",       icon: "🖼", desc: "Grid, masonry, or slideshow layout" },
  video:     { label: "Video",         icon: "▶", desc: "Embedded video message or highlight" },
  wishing:   { label: "Wishing Well",  icon: "✨", desc: "Guests can leave digital wishes" },
  khqr:      { label: "KHQR Payment",  icon: "💳", desc: "Cambodian QR code for monetary gifts" },
};

const INITIAL_SECTIONS: WizardSection[] = [
  { type: "cover",     included: true,  content: { heading: "", subheading: "" } },
  { type: "countdown", included: false, content: { targetDate: "", label: "Countdown to the big day" } },
  { type: "details",   included: true,  content: { items: [
    { icon: "📍", label: "Venue", value: "" },
    { icon: "🕐", label: "Time", value: "" },
    { icon: "👗", label: "Dress Code", value: "" },
  ], photoItems: [] } },
  { type: "gallery",   included: false, content: { layout: "grid" } },
  { type: "video",     included: false, content: { url: "", caption: "" } },
  { type: "wishing",   included: false, content: { placeholder: "Leave us a sweet message…" } },
  { type: "khqr",      included: false, content: { recipientName: "", amount: "", currency: "KHR" } },
];

const COLOR_PRESETS: Array<{ label: string; text: string; accent: string }> = [
  { label: "Classic Gold",    text: "#ffffff", accent: "#c9a96e" },
  { label: "Rose Blush",      text: "#fff0f5", accent: "#e91e8c" },
  { label: "Sage Garden",     text: "#f0fff4", accent: "#38a169" },
  { label: "Ocean Blue",      text: "#e8f4f8", accent: "#2b6cb0" },
  { label: "Midnight Purple", text: "#f5f0ff", accent: "#805ad5" },
  { label: "Warm Ivory",      text: "#fffff0", accent: "#d69e2e" },
];

const INITIAL_OVERLAY: OverlayConfig = {
  style:   "floating",
  map:    { enabled: false, inputType: "url", url: "", imageUrl: "" },
  music:  { enabled: true },
  goToTop:{ enabled: true },
  gifts:  { enabled: false },
  colorScheme: { text: "#ffffff", accent: "#c9a96e" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseSections(raw: unknown): WizardSection[] {
  if (!Array.isArray(raw) || raw.length === 0) return INITIAL_SECTIONS;
  if (typeof raw[0] !== "object" || raw[0] === null) return INITIAL_SECTIONS;
  return (raw as WizardSection[]).map(s => {
    if (s.type === "details") {
      const c = s.content as { items?: DetailItem[]; photoItems?: PhotoDetailItem[] };
      if (!c.photoItems) {
        return { ...s, content: { items: c.items ?? [], photoItems: [] as PhotoDetailItem[] } } as WizardSection;
      }
    }
    return s;
  });
}

function parseOverlay(raw: unknown): OverlayConfig {
  if (!raw || typeof raw !== "object") return INITIAL_OVERLAY;
  return { ...INITIAL_OVERLAY, ...(raw as Partial<OverlayConfig>) };
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
         onClick={() => onChange(!on)}>
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
  pill:  { width: 40, height: 22, borderRadius: 11, flexShrink: 0, position: "relative" as const, transition: "background 0.2s" },
  pillOn:  { background: "var(--c-accent)" },
  pillOff: { background: "var(--c-surface-2)", border: "1px solid var(--c-border)" },
  knob:  { position: "absolute" as const, top: 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "transform 0.2s" },
} as const;

// Compact file / video picker
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
            {objUrl
              ? isVideo
                ? <video src={objUrl} style={fp.img} muted />
                : <img src={objUrl} alt="" style={fp.img} />
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
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
        onChange={e => setFile(e.target.files?.[0] ?? null)} />
    </div>
  );
}
const fp = {
  wrap: { paddingBottom: "0.75rem", marginBottom: "0.75rem", borderBottom: "1px solid var(--c-border)" },
  row:  { display: "flex", gap: "0.75rem", alignItems: "flex-start" },
  thumb: { width: 52, height: 52, flexShrink: 0, borderRadius: 7, background: "var(--c-surface-2)", border: "1px solid var(--c-border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  img:  { width: "100%", height: "100%", objectFit: "cover" as const },
  info: { flex: 1, minWidth: 0 },
  labelRow: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 2 },
  lbl:  { fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)" },
  opt:  { fontSize: "0.6875rem", color: "var(--c-muted)", background: "var(--c-surface-2)", borderRadius: 4, padding: "0.1rem 0.375rem" },
  hint: { fontSize: "0.8125rem", color: "var(--c-muted)", marginBottom: "0.4rem" },
  btnRow: { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" as const },
  pick: { padding: "0.3rem 0.75rem", background: "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-text)" },
  rm:   { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8125rem", padding: 0 },
  fname:{ fontSize: "0.75rem", color: "var(--c-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 180 },
} as const;

// Inline image picker that uploads immediately when a file is chosen
function SectionImagePicker({ label, value, onChange, optional = true }: {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  optional?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "themessections");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (!json.url) throw new Error("No URL returned from upload");
      onChange(json.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={sip.wrap}>
      <div style={sip.row}>
        <div style={sip.thumb}>
          {value
            ? <img src={value} alt="" style={sip.img} />
            : <span style={{ fontSize: "1.125rem", color: "var(--c-muted)" }}>🖼</span>}
        </div>
        <div style={sip.info}>
          <div style={sip.top}>
            <span style={sip.lbl}>{label}</span>
            {optional && <span style={fp.opt}>optional</span>}
          </div>
          <div style={fp.btnRow}>
            <button type="button" disabled={uploading} onClick={() => ref.current?.click()} style={fp.pick}>
              {uploading ? "Uploading…" : value ? "Change" : "Upload image"}
            </button>
            {value && !uploading && (
              <button type="button" onClick={() => onChange(undefined)} style={fp.rm}>Remove</button>
            )}
          </div>
          {err && <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>{err}</span>}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}
const sip = {
  wrap: { marginBottom: "0.625rem" },
  row:  { display: "flex", gap: "0.75rem", alignItems: "center" },
  thumb:{ width: 56, height: 44, flexShrink: 0, borderRadius: 7, background: "var(--c-surface-2)", border: "1px solid var(--c-border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  img:  { width: "100%", height: "100%", objectFit: "cover" as const },
  info: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, gap: "0.3rem" },
  top:  { display: "flex", alignItems: "center", gap: "0.5rem" },
  lbl:  { fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)" },
} as const;

// ─── Text-mode section editors ────────────────────────────────────────────────
function CoverEditor({ c, set }: { c: { heading: string; subheading: string; imageUrl?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.g2}>
    <Field label="Heading"><input style={ed.inp} placeholder="We're Getting Married" value={c.heading} onChange={e => set({ ...c, heading: e.target.value })} /></Field>
    <Field label="Subheading"><input style={ed.inp} placeholder="Join us for our special day" value={c.subheading} onChange={e => set({ ...c, subheading: e.target.value })} /></Field>
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
        <input style={{ ...ed.inp, width: 48, textAlign: "center" as const, padding: "0.375rem" }} value={it.icon} onChange={e => update(i, { icon: e.target.value })} />
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
      <button key={l} type="button" onClick={() => set({ layout: l })}
        style={{ ...ed.layoutBtn, ...(c.layout === l ? ed.layoutBtnOn : {}) }}>
        {l === "grid" ? "▦" : l === "masonry" ? "▤" : "▷"} {l.charAt(0).toUpperCase() + l.slice(1)}
      </button>
    ))}
  </div>;
}
function VideoEditor({ c, set }: { c: { url: string; caption: string; thumbnailUrl?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.col}>
    <Field label="Video URL (optional — clients provide their own)"><input style={ed.inp} placeholder="https://youtube.com/…" value={c.url} onChange={e => set({ ...c, url: e.target.value })} /></Field>
    <Field label="Default caption"><input style={ed.inp} placeholder="Watch our story…" value={c.caption} onChange={e => set({ ...c, caption: e.target.value })} /></Field>
  </div>;
}
function WishingEditor({ c, set }: { c: { placeholder: string; backgroundImageUrl?: string }; set: (v: SectionContent) => void }) {
  return <Field label="Input placeholder">
    <textarea style={{ ...ed.inp, minHeight: 60, resize: "vertical" as const }} value={c.placeholder} onChange={e => set({ ...c, placeholder: e.target.value })} />
  </Field>;
}
function KhqrEditor({ c, set }: { c: { recipientName: string; amount: string; currency: "KHR" | "USD"; qrImageUrl?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.col}>
    <SectionImagePicker label="QR code image" value={c.qrImageUrl} onChange={url => set({ ...c, qrImageUrl: url })} />
    <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" as const }}>
      <Field label="Recipient name" style={{ flex: 2 }}><input style={ed.inp} placeholder="Sophea & Dara" value={c.recipientName} onChange={e => set({ ...c, recipientName: e.target.value })} /></Field>
      <Field label="Default amount"><input style={ed.inp} type="number" placeholder="0" value={c.amount} onChange={e => set({ ...c, amount: e.target.value })} /></Field>
      <Field label="Currency">
        <select style={ed.sel} value={c.currency} onChange={e => set({ ...c, currency: e.target.value as "KHR" | "USD" })}>
          <option value="KHR">KHR (Riel)</option>
          <option value="USD">USD ($)</option>
        </select>
      </Field>
    </div>
  </div>;
}

// ─── Photo-mode section editors ───────────────────────────────────────────────
function PhotoCoverEditor({ c, set }: { c: { heading: string; subheading: string; imageUrl?: string }; set: (v: SectionContent) => void }) {
  return <div style={ed.col}>
    <SectionImagePicker label="Cover photo" value={c.imageUrl} onChange={url => set({ ...c, imageUrl: url })} />
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
    {photoItems.length === 0 && (
      <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--c-muted)" }}>
        Add photo agenda items — each will display as an image card on the invitation.
      </p>
    )}
    {photoItems.map((item, i) => (
      <div key={i} style={{ border: "1px solid var(--c-border)", borderRadius: 8, padding: "0.75rem", background: "var(--c-surface-2)", display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-muted)" }}>Item {i + 1}</span>
          <button type="button" style={ed.rmBtn} onClick={() => set({ ...c, photoItems: photoItems.filter((_, idx) => idx !== i) })}>✕ Remove</button>
        </div>
        <SectionImagePicker label="Image" value={item.imageUrl} onChange={url => updateItem(i, { imageUrl: url ?? "" })} optional={false} />
        <Field label="Caption / label"><input style={ed.inp} placeholder="e.g. Ceremony at 10:00 AM" value={item.caption} onChange={e => updateItem(i, { caption: e.target.value })} /></Field>
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
    <Field label="Input placeholder">
      <textarea style={{ ...ed.inp, minHeight: 60, resize: "vertical" as const }} value={c.placeholder} onChange={e => set({ ...c, placeholder: e.target.value })} />
    </Field>
  </div>;
}

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", ...style }}>
    <label style={ed.lbl}>{label}</label>
    {children}
  </div>;
}

// ─── Editor registry ──────────────────────────────────────────────────────────
type EditorProps = { content: SectionContent; onChange: (c: SectionContent) => void };

function getEditor(type: SectionType, contentType: ContentType): (p: EditorProps) => React.ReactElement {
  if (contentType === "photo") {
    const photoEditors: Partial<Record<SectionType, (p: EditorProps) => React.ReactElement>> = {
      cover:   ({ content, onChange }) => <PhotoCoverEditor   c={content as never} set={onChange} />,
      details: ({ content, onChange }) => <PhotoDetailsEditor c={content as never} set={onChange} />,
      video:   ({ content, onChange }) => <PhotoVideoEditor   c={content as never} set={onChange} />,
      wishing: ({ content, onChange }) => <PhotoWishingEditor c={content as never} set={onChange} />,
      // countdown, gallery, khqr → use text editors below
    };
    if (photoEditors[type]) return photoEditors[type]!;
  }
  const textEditors: Record<SectionType, (p: EditorProps) => React.ReactElement> = {
    cover:     ({ content, onChange }) => <CoverEditor     c={content as never} set={onChange} />,
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
  col:  { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  g2:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" },
  inp:  { padding: "0.4rem 0.625rem", border: "1px solid var(--c-border)", background: "var(--c-surface)", color: "var(--c-text)", borderRadius: 6, fontSize: "0.875rem", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
  sel:  { padding: "0.4rem 0.625rem", border: "1px solid var(--c-border)", background: "var(--c-surface)", color: "var(--c-text)", borderRadius: 6, fontSize: "0.875rem", width: "100%", fontFamily: "inherit" },
  lbl:  { fontSize: "0.75rem", fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  itemRow: { display: "flex", gap: "0.5rem", alignItems: "center" },
  rmBtn:   { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8125rem", padding: "0.25rem", flexShrink: 0 },
  addBtn:  { padding: "0.375rem 0.75rem", background: "transparent", border: "1px dashed var(--c-border)", borderRadius: 6, cursor: "pointer", fontSize: "0.8125rem", color: "var(--c-muted)", alignSelf: "flex-start" as const },
  layoutBtn: { padding: "0.4rem 0.875rem", border: "2px solid var(--c-border)", borderRadius: 6, background: "var(--c-surface)", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-muted)" },
  layoutBtnOn: { borderColor: "var(--c-accent)", background: "var(--c-accent-soft)", color: "var(--c-accent)" },
} as const;

const cs = {
  presets:    { display: "flex", gap: "0.5rem", flexWrap: "wrap" as const, marginBottom: "0.375rem" },
  swatch:     { width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.12)", cursor: "pointer", flexShrink: 0, padding: 0 },
  customRow:  { display: "flex", gap: "1.5rem", marginTop: "0.5rem" },
  customItem: { display: "flex", flexDirection: "column" as const, gap: "0.25rem" },
  customLbl:  { fontSize: "0.75rem", fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  colorWrap:  { display: "flex", alignItems: "center", gap: "0.5rem" },
  colorInput: { width: 36, height: 28, padding: 2, border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", background: "none" },
  colorHex:   { fontSize: "0.8125rem", color: "var(--c-text)", fontFamily: "monospace" },
} as const;

// ─── Section accordion row ────────────────────────────────────────────────────
// IMPORTANT: getEditor() returns an anonymous wrapper on every call.
// Using it as <Editor /> gives React a new component type each render → unmount/remount → focus lost.
// Calling it as a plain function returns a stable React element (e.g. <CoverEditor />) that
// React can reconcile without remounting, so controlled inputs keep focus.
function SectionRow({ sec, contentType, onChange }: {
  sec: WizardSection;
  contentType: ContentType;
  onChange: (p: Partial<WizardSection>) => void;
}) {
  const meta = SECTION_META[sec.type];
  const isCountdownOverride = contentType === "photo" && sec.type === "countdown";

  return (
    <div style={{ ...sr.wrap, ...(sec.included ? sr.wrapOn : {}) }}>
      <div style={sr.header}>
        <span style={sr.icon}>{meta.icon}</span>
        <div style={sr.info}>
          <div style={sr.lbl}>{meta.label}</div>
          <div style={sr.desc}>
            {meta.desc}
            {isCountdownOverride && <span style={sr.textOnlyBadge}> · text-only</span>}
          </div>
        </div>
        {meta.locked
          ? <span style={sr.badge}>Required</span>
          : <div role="switch" aria-checked={sec.included}
              onClick={() => onChange({ included: !sec.included })}
              style={{ ...t.pill, ...(sec.included ? t.pillOn : t.pillOff), cursor: "pointer" }}>
              <div style={{ ...t.knob, transform: sec.included ? "translateX(18px)" : "translateX(2px)" }} />
            </div>
        }
      </div>
      {sec.included && (
        <div style={sr.editor}>
          {getEditor(sec.type, contentType)({
            content: sec.content,
            onChange: (content) => onChange({ content }),
          })}
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
  textOnlyBadge: { color: "var(--c-muted)", fontStyle: "italic" as const },
  editor: { padding: "0.875rem 1rem", borderTop: "1px solid var(--c-border)", background: "var(--c-surface)" },
} as const;

// ─── Overlay button card ──────────────────────────────────────────────────────
function OverlayCard({ icon, label, desc, enabled, onToggle, children }: {
  icon: string; label: string; desc: string;
  enabled: boolean; onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ ...ov.card, ...(enabled ? ov.cardOn : {}) }}>
      <div style={ov.header}>
        <span style={ov.icon}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={ov.lbl}>{label}</div>
          <div style={ov.desc}>{desc}</div>
        </div>
        <div role="switch" aria-checked={enabled} onClick={onToggle}
          style={{ ...t.pill, ...(enabled ? t.pillOn : t.pillOff), cursor: "pointer" }}>
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

// ─── Wizard ───────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  theme?: Theme;
}

export function NewThemeWizard({ onClose, theme }: Props) {
  const router = useRouter();
  const isEdit = !!theme;
  const STEPS = 4;
  const [step, setStep]           = useState(1);
  const [maxVisited, setMaxVisited] = useState(isEdit ? STEPS : 1);

  function goToStep(idx: number) {
    if (idx >= 1 && idx <= maxVisited) setStep(idx);
  }

  const [name, setName]               = useState(theme?.name ?? "");
  const [contentType, setContentType] = useState<ContentType>((theme?.contentType as ContentType) ?? "photo");
  const [isAnimated, setIsAnimated]   = useState(theme?.isAnimated ?? false);
  const [sortOrder, setSortOrder]     = useState(theme?.sortOrder ?? 0);

  const [sections, setSections] = useState<WizardSection[]>(parseSections(theme?.defaultSections));
  const [overlay, setOverlay]   = useState<OverlayConfig>(parseOverlay(theme?.overlayConfig));
  const [mapImageFile, setMapImageFile] = useState<File | null>(null);

  const [bgAssetType, setBgAssetType] = useState<BgAssetType>(theme?.backgroundVideoUrl ? "video" : "image");
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgVideoFile, setBgVideoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile]     = useState<File | null>(null);
  const [thumbFile, setThumbFile]     = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [musicFile, setMusicFile]     = useState<File | null>(null);

  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState("");

  const updateSection = useCallback((type: SectionType, patch: Partial<WizardSection>) => {
    setSections(prev => prev.map(s => s.type === type ? { ...s, ...patch } : s));
  }, []);

  const patchOverlay = (patch: Partial<OverlayConfig>) => setOverlay(prev => ({ ...prev, ...patch }));

  async function upload(file: File, folder: string) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error(`Upload failed: ${file.name}`);
    return (await res.json() as { url: string }).url;
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      let mapImageUrl = overlay.map.imageUrl;
      if (mapImageFile) mapImageUrl = await upload(mapImageFile, "themes/map");

      const [bgImageUrl, bgVideoUrl, coverUrl, thumbUrl, previewUrl, musicUrl] = await Promise.all([
        bgAssetType === "image" && bgImageFile ? upload(bgImageFile, "themes/backgrounds") : Promise.resolve(isEdit ? theme.backgroundUrl : null),
        bgAssetType === "video" && bgVideoFile ? upload(bgVideoFile, "themes/backgrounds/video") : Promise.resolve(isEdit ? theme.backgroundVideoUrl : null),
        coverFile   ? upload(coverFile,   "themes/covers")     : Promise.resolve(isEdit ? theme.coverUrl : null),
        thumbFile   ? upload(thumbFile,   "themes/thumbnails") : Promise.resolve(isEdit ? theme.thumbnailUrl : null),
        previewFile ? upload(previewFile, "themes/preview")    : Promise.resolve(isEdit ? theme.previewUrl : null),
        musicFile   ? upload(musicFile,   "themes/music")      : Promise.resolve(isEdit ? theme.musicUrl : null),
      ]);

      const finalOverlay: OverlayConfig = { ...overlay, map: { ...overlay.map, imageUrl: mapImageUrl } };

      const payload = {
        name: name.trim(), contentType, isAnimated, sortOrder,
        defaultSections: sections,
        overlayConfig: finalOverlay,
        backgroundUrl: bgAssetType === "image" ? bgImageUrl : null,
        backgroundVideoUrl: bgAssetType === "video" ? bgVideoUrl : null,
        coverUrl, thumbnailUrl: thumbUrl, previewUrl, musicUrl,
      };

      const url    = isEdit ? `/api/admin/themes/${theme.id}` : "/api/admin/themes";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Failed to save"); return; }
      router.refresh();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!theme || !confirm(`Delete "${theme.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/themes/${theme.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) { setError("Delete failed — theme may still be in use."); return; }
    router.refresh();
    onClose();
  }

  const stepLabels = ["Identity", "Sections", "Overlays", "Assets"];
  const canAdvance = step === 1 ? name.trim().length > 0 : true;

  const sectionNote = contentType === "photo"
    ? "Photo-based: section content is image-driven. Countdown is text-only."
    : "Text-based: section content is text-driven. Gallery and KHQR Payment remain image-based.";

  return (
    <div style={w.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={w.modal}>

        <div style={w.header}>
          <div>
            <h2 style={w.title}>{isEdit ? `Edit — ${theme.name}` : "New Theme"}</h2>
            <p style={w.subtitle}>
              {step === 1 && "Name your theme and choose its visual style"}
              {step === 2 && "Enable sections and set their default content"}
              {step === 3 && "Configure floating overlay buttons for guests"}
              {step === 4 && "Upload background, cover, thumbnails, and music"}
            </p>
          </div>
          <button onClick={onClose} style={w.closeBtn} aria-label="Close">✕</button>
        </div>

        <div style={w.stepBar}>
          {stepLabels.map((lbl, i) => {
            const idx = i + 1;
            const done = step > idx; const active = step === idx;
            const accessible = idx <= maxVisited;
            return (
              <div key={lbl} style={w.stepItem}>
                <button
                  type="button"
                  onClick={() => goToStep(idx)}
                  disabled={!accessible}
                  style={{
                    ...w.dot,
                    ...(done ? w.dotDone : active ? w.dotActive : w.dotFuture),
                    cursor: accessible ? "pointer" : "default",
                    border: "none", padding: 0,
                  }}
                >
                  {done ? "✓" : idx}
                </button>
                <span style={{ ...w.dotLbl, fontWeight: active ? 600 : 400, color: active ? "var(--c-text)" : "var(--c-muted)" }}>{lbl}</span>
                {i < stepLabels.length - 1 && <div style={w.line} />}
              </div>
            );
          })}
        </div>
        <div style={w.track}><div style={{ ...w.fill, width: `${((step - 1) / (STEPS - 1)) * 100}%` }} /></div>

        <div style={w.body}>

          {/* Step 1 — Identity */}
          {step === 1 && (
            <div style={w.col}>
              <div style={w.field}>
                <label style={w.flbl}>Theme name <span style={{ color: "#dc2626" }}>*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} autoFocus
                  placeholder="e.g. Golden Khmer, Blush Romance…" style={w.inp} />
              </div>

              <div style={w.field}>
                <label style={w.flbl}>Content style</label>
                <p style={w.note}>Determines how section content is structured — image-led or text-led.</p>
                <div style={w.typeGrid}>
                  {(["photo", "text"] as ContentType[]).map(type => (
                    <button key={type} type="button" onClick={() => setContentType(type)}
                      style={{ ...w.typeCard, ...(contentType === type ? w.typeCardOn : {}) }}>
                      <span style={{ fontSize: "1.75rem" }}>{type === "photo" ? "🖼" : "✏️"}</span>
                      <span style={w.typeTitle}>{type === "photo" ? "Photo-first" : "Text-first"}</span>
                      <span style={w.typeDesc}>
                        {type === "photo"
                          ? "Sections driven by uploaded images — agenda items, covers, and wishing backgrounds are photo-based"
                          : "Sections driven by text & typography — fill in labels, headings, and details"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" as const }}>
                <div style={{ ...w.field, flex: 1 }}>
                  <label style={w.flbl}>Sort order</label>
                  <input type="number" value={sortOrder} min={0} style={w.inp} onChange={e => setSortOrder(Number(e.target.value))} />
                </div>
                <div style={{ marginTop: "0.25rem" }}>
                  <Toggle on={isAnimated} onChange={setIsAnimated} label="Animated theme" sub="CSS transitions & motion effects" />
                </div>
              </div>

              <div style={w.field}>
                <label style={w.flbl}>Color scheme</label>
                <p style={w.note}>Invitation text and accent color — guests see these colors on the invitation page.</p>
                <div style={cs.presets}>
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      title={preset.label}
                      onClick={() => patchOverlay({ colorScheme: { text: preset.text, accent: preset.accent } })}
                      style={{
                        ...cs.swatch,
                        background: preset.accent,
                        outline: overlay.colorScheme.accent === preset.accent && overlay.colorScheme.text === preset.text
                          ? "2px solid var(--c-accent)" : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
                <div style={cs.customRow}>
                  <div style={cs.customItem}>
                    <span style={cs.customLbl}>Text color</span>
                    <div style={cs.colorWrap}>
                      <input type="color" value={overlay.colorScheme.text}
                        onChange={e => patchOverlay({ colorScheme: { ...overlay.colorScheme, text: e.target.value } })}
                        style={cs.colorInput} />
                      <span style={cs.colorHex}>{overlay.colorScheme.text}</span>
                    </div>
                  </div>
                  <div style={cs.customItem}>
                    <span style={cs.customLbl}>Accent color</span>
                    <div style={cs.colorWrap}>
                      <input type="color" value={overlay.colorScheme.accent}
                        onChange={e => patchOverlay({ colorScheme: { ...overlay.colorScheme, accent: e.target.value } })}
                        style={cs.colorInput} />
                      <span style={cs.colorHex}>{overlay.colorScheme.accent}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.625rem", alignItems: "center" }}>
                  <div style={{ background: overlay.colorScheme.accent, color: overlay.colorScheme.text, borderRadius: 6, padding: "0.3rem 0.875rem", fontSize: "0.8125rem", fontWeight: 600 }}>
                    Aa Accent
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.7)", color: overlay.colorScheme.text, borderRadius: 6, padding: "0.3rem 0.875rem", fontSize: "0.8125rem" }}>
                    Text preview
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Sections */}
          {step === 2 && (
            <div style={w.col}>
              <div style={w.modeBanner}>
                <span style={{ fontSize: "1rem" }}>{contentType === "photo" ? "🖼" : "✏️"}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--c-text)", fontWeight: 500 }}>{sectionNote}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
                {sections.map(sec => (
                  <SectionRow key={sec.type} sec={sec} contentType={contentType} onChange={p => updateSection(sec.type, p)} />
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Overlays */}
          {step === 3 && (
            <div style={w.col}>
              <p style={w.note}>Choose which floating buttons appear on the invitation page and how they are displayed.</p>

              <div style={w.field}>
                <label style={w.flbl}>Button display style</label>
                <div style={w.typeGrid}>
                  {([
                    ["floating",  "Floating icons",    "Individual circular icons positioned over the page", "◉"],
                    ["bottomBar", "Bottom menu bar",   "Fixed tab bar at the bottom, like a mobile app",     "▬"],
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

              <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
                <OverlayCard icon="🗺" label="Map button" desc="Opens a location map overlay when guests tap it"
                  enabled={overlay.map.enabled} onToggle={() => patchOverlay({ map: { ...overlay.map, enabled: !overlay.map.enabled } })}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    {(["url", "image"] as MapInputType[]).map(mt => (
                      <button key={mt} type="button"
                        onClick={() => patchOverlay({ map: { ...overlay.map, inputType: mt } })}
                        style={{ ...ed.layoutBtn, ...(overlay.map.inputType === mt ? ed.layoutBtnOn : {}) }}>
                        {mt === "url" ? "🔗 Google Maps URL" : "🖼 Upload image"}
                      </button>
                    ))}
                  </div>
                  {overlay.map.inputType === "url"
                    ? <Field label="Google Maps embed URL">
                        <input style={ed.inp} placeholder="https://maps.google.com/…" value={overlay.map.url}
                          onChange={e => patchOverlay({ map: { ...overlay.map, url: e.target.value } })} />
                      </Field>
                    : <FilePicker label="Map image" hint="Upload a static map image shown in the overlay (≤ 10 MB)"
                        accept="image/jpeg,image/png,image/webp"
                        file={mapImageFile} setFile={setMapImageFile} preview />
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
          {step === 4 && (
            <div style={w.col}>
              <p style={w.note}>Upload the visual assets for this theme. Clients will see their own content layered on top.</p>

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
                <p style={{ ...w.note, marginTop: "0.25rem" }}>
                  {bgAssetType === "video"
                    ? "Guests land on a cover page — after tapping \"Open\", the video plays then transitions into sections."
                    : "A CSS/animation sequence runs before revealing the invitation sections."}
                </p>
              </div>

              {bgAssetType === "image"
                ? <FilePicker label="Background image" hint="Full-page background shown behind all sections (≤ 10 MB)"
                    accept="image/jpeg,image/png,image/webp"
                    file={bgImageFile} setFile={setBgImageFile} preview />
                : <FilePicker label="Background video" hint="Motion video shown as background — MP4 or WebM recommended (≤ 200 MB)"
                    accept="video/mp4,video/webm,video/quicktime"
                    file={bgVideoFile} setFile={setBgVideoFile} preview />
              }

              <div style={w.assetGrid}>
                <FilePicker label="Cover image" hint="Hero / cover section overlay image (≤ 10 MB)"
                  accept="image/jpeg,image/png,image/webp" file={coverFile} setFile={setCoverFile} preview />
                <FilePicker label="Thumbnail" hint="Small card preview in the theme picker (≤ 5 MB)"
                  accept="image/jpeg,image/png,image/webp" file={thumbFile} setFile={setThumbFile} preview />
                <FilePicker label="Preview image" hint="Full-size preview shown in the admin list (≤ 5 MB)"
                  accept="image/jpeg,image/png,image/webp" file={previewFile} setFile={setPreviewFile} preview />
              </div>

              <FilePicker label="Background music" hint="Ambient audio played while guests browse — MP3, WAV, AAC (≤ 20 MB)"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/aac,audio/ogg"
                file={musicFile} setFile={setMusicFile} />

              {isEdit && (
                <div style={w.existingAssets}>
                  <div style={w.eaTitle}>Current assets (will be kept unless you upload a replacement)</div>
                  <div style={w.eaGrid}>
                    {theme.thumbnailUrl    && <div style={w.eaItem}><img src={theme.thumbnailUrl}       alt="thumb"   style={w.eaImg} /><span style={w.eaLbl}>Thumbnail</span></div>}
                    {theme.previewUrl      && <div style={w.eaItem}><img src={theme.previewUrl}         alt="preview" style={w.eaImg} /><span style={w.eaLbl}>Preview</span></div>}
                    {theme.backgroundUrl   && <div style={w.eaItem}><img src={theme.backgroundUrl}      alt="bg"      style={w.eaImg} /><span style={w.eaLbl}>Background</span></div>}
                    {theme.coverUrl        && <div style={w.eaItem}><img src={theme.coverUrl}           alt="cover"   style={w.eaImg} /><span style={w.eaLbl}>Cover</span></div>}
                    {theme.backgroundVideoUrl && <div style={w.eaItem}><video src={theme.backgroundVideoUrl} style={w.eaImg} muted /><span style={w.eaLbl}>Video BG</span></div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p style={w.err}>{error}</p>}
        </div>

        <div style={w.footer}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button type="button" style={w.backBtn}
              onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>
              {step === 1 ? "Cancel" : "← Back"}
            </button>
            {isEdit && (
              <button type="button" onClick={handleDelete} disabled={deleting} style={w.deleteBtn}>
                {deleting ? "Deleting…" : "Delete theme"}
              </button>
            )}
          </div>
          {step < STEPS
            ? <button type="button" disabled={!canAdvance} onClick={() => { if (canAdvance) { setMaxVisited(m => Math.max(m, step + 1)); setStep(s => s + 1); } }}
                style={{ ...w.nextBtn, opacity: canAdvance ? 1 : 0.4 }}>Next →</button>
            : <button type="button" disabled={loading} onClick={handleSave} style={w.nextBtn}>
                {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create Theme"}
              </button>
          }
        </div>

      </div>
    </div>
  );
}

// ─── Wizard styles ────────────────────────────────────────────────────────────
const w = {
  overlay:  { position: "fixed" as const, inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  modal:    { background: "var(--c-surface)", color: "var(--c-text)", borderRadius: 16, width: "100%", maxWidth: 660, maxHeight: "92vh", overflowY: "auto" as const, boxShadow: "0 24px 80px rgba(0,0,0,0.45)", border: "1px solid var(--c-border)", display: "flex", flexDirection: "column" as const },
  header:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1.5rem 1.5rem 1rem", flexShrink: 0 },
  title:    { margin: 0, fontSize: "1.125rem", fontWeight: 700 },
  subtitle: { margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--c-muted)" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", fontSize: "1.125rem", lineHeight: 1, padding: 4 },

  stepBar:  { display: "flex", alignItems: "center", padding: "0 1.5rem 1rem", flexShrink: 0 },
  stepItem: { display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 },
  dot:      { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 },
  dotActive:{ background: "var(--c-accent)", color: "#fff" },
  dotDone:  { background: "#16a34a", color: "#fff" },
  dotFuture:{ background: "var(--c-surface-2)", color: "var(--c-muted)", border: "1px solid var(--c-border)" },
  dotLbl:   { fontSize: "0.8125rem" },
  line:     { flex: 1, height: 1, background: "var(--c-border)", margin: "0 0.5rem" },
  track:    { height: 3, background: "var(--c-surface-2)", margin: "0 1.5rem", borderRadius: 2, flexShrink: 0 },
  fill:     { height: "100%", background: "var(--c-accent)", borderRadius: 2, transition: "width 0.3s ease" },

  body:     { padding: "1.25rem 1.5rem", flex: 1, overflowY: "auto" as const },
  col:      { display: "flex", flexDirection: "column" as const, gap: "1.25rem" },
  note:     { margin: 0, fontSize: "0.875rem", color: "var(--c-muted)", lineHeight: 1.55 },

  modeBanner: { display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", background: "var(--c-accent-soft)", borderRadius: 8, border: "1px solid var(--c-border)" },

  field:    { display: "flex", flexDirection: "column" as const, gap: "0.375rem" },
  flbl:     { fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)" },
  inp:      { padding: "0.5625rem 0.875rem", border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", borderRadius: 8, fontSize: "0.9375rem", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },

  typeGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  typeCard:   { padding: "1rem", border: "2px solid var(--c-border)", borderRadius: 10, background: "var(--c-surface-2)", cursor: "pointer", textAlign: "left" as const, display: "flex", flexDirection: "column" as const, gap: "0.3rem" },
  typeCardOn: { borderColor: "var(--c-accent)", background: "var(--c-accent-soft)" },
  typeTitle:  { fontSize: "0.9375rem", fontWeight: 600, color: "var(--c-text)", display: "block" },
  typeDesc:   { fontSize: "0.8125rem", color: "var(--c-muted)", lineHeight: 1.4, display: "block" },

  assetGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },

  existingAssets: { border: "1px solid var(--c-border)", borderRadius: 10, padding: "0.875rem", background: "var(--c-surface-2)" },
  eaTitle: { fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-muted)", marginBottom: "0.625rem" },
  eaGrid:  { display: "flex", gap: "0.625rem", flexWrap: "wrap" as const },
  eaItem:  { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.25rem" },
  eaImg:   { width: 64, height: 48, objectFit: "cover" as const, borderRadius: 6, border: "1px solid var(--c-border)" },
  eaLbl:   { fontSize: "0.6875rem", color: "var(--c-muted)" },

  footer:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderTop: "1px solid var(--c-border)", flexShrink: 0, background: "var(--c-surface)" },
  backBtn:   { padding: "0.5rem 1.125rem", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, cursor: "pointer", fontSize: "0.9375rem", color: "var(--c-text)" },
  deleteBtn: { padding: "0.5rem 1rem", background: "transparent", border: "1px solid #fca5a5", borderRadius: 8, cursor: "pointer", fontSize: "0.875rem", color: "#dc2626" },
  nextBtn:   { padding: "0.5rem 1.5rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.9375rem", fontWeight: 600, transition: "opacity 0.15s" },
  err:       { margin: "0.75rem 0 0", padding: "0.625rem 0.875rem", background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: "0.875rem" },
} as const;
