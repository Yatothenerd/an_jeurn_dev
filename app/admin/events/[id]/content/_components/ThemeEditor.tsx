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
import { HEADING_FONTS, BODY_FONTS } from "@/lib/themes/shared/standard-css";
import { FontPicker, ColorField, SizeField } from "@/app/admin/_components/StyleControls";
import { DEFAULT_FLOAT_BUTTONS, type DesignFloatButtons } from "@/lib/themes/design";

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
interface SectionStyleOverride {
  titleFont?: string; titleColor?: string; titleScale?: number;
  bodyFont?: string;  bodyColor?: string;  bodyScale?: number;
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

function TextStylePanel({ value, onChange }: {
  value: SectionStyleOverride;
  onChange: (next: SectionStyleOverride) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<SectionStyleOverride>) => onChange({ ...value, ...patch });
  const active = Object.values(value).some((v) => v !== undefined && v !== "" && v !== 1);

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
            <FontPicker value={value.titleFont ?? ""} onChange={(v) => set({ titleFont: v || undefined })} options={HEADING_FONTS} />
          </Field>
          <Field label="Title color">
            <ColorField value={value.titleColor ?? ""} onChange={(v) => set({ titleColor: v || undefined })} />
          </Field>
          <Field label="Title size">
            <SizeField value={value.titleScale ?? 1} onChange={(v) => set({ titleScale: v === 1 ? undefined : v })} />
          </Field>
          <Field label="Body font">
            <FontPicker value={value.bodyFont ?? ""} onChange={(v) => set({ bodyFont: v || undefined })} options={BODY_FONTS} />
          </Field>
          <Field label="Body color">
            <ColorField value={value.bodyColor ?? ""} onChange={(v) => set({ bodyColor: v || undefined })} />
          </Field>
          <Field label="Body size">
            <SizeField value={value.bodyScale ?? 1} onChange={(v) => set({ bodyScale: v === 1 ? undefined : v })} />
          </Field>
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

// ── Per-section content forms ────────────────────────────────────────────────

function SectionForm({ sec, onContent, locked, altLang }: {
  sec: EditorSection;
  onContent: (patch: SectionContent) => void;
  locked?: boolean;
  /** When true, text edits write to the secondary language (content.i18n). */
  altLang?: boolean;
}) {
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
          style={{ ...s.smallBtn, ...(m === (isImageMode ? "image" : "text") ? { background: "var(--c-accent)", color: "#fff", border: "1px solid var(--c-accent)" } : {}) }}
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
  const stylePanel = !locked && (
    <TextStylePanel value={styleOverride} onChange={(next) => onContent({ _style: next })} />
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
          <Field label="Names / heading"><Txt value={str("heading")} onChange={set("heading")} placeholder="Artem + Vika" /></Field>
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
        </>
      );
    case "countdown":
      return (
        <>
          <Field label="Title"><Txt value={str("label")} onChange={set("label")} placeholder="When?" /></Field>
          <Field label="Target date & time">
            <Txt type="datetime-local" value={str("targetDate").slice(0, 16)} onChange={set("targetDate")} />
          </Field>
        </>
      );
    case "agenda": {
      const items = (Array.isArray(c.items) ? c.items : []) as Array<{ time?: string; title?: string }>;
      const setItems = (next: typeof items) => onC({ items: next });
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="What time?" /></Field>
          {items.map((it, i) => (
            <div key={i} style={s.rowGroup}>
              <input value={it.time ?? ""} placeholder="15:30" style={{ ...s.input, width: 82, flexShrink: 0 }}
                onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
              <input value={it.title ?? ""} placeholder="Ceremony" style={s.input}
                onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <button type="button" style={s.smallGhost} onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button type="button" style={s.smallBtn} onClick={() => setItems([...items, { time: "", title: "" }])}>+ Add moment</button>
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
          <Field label="Map button label"><Txt value={str("mapLabel")} onChange={set("mapLabel")} placeholder="open map" /></Field>

          <div style={s.subHead}>Dress code</div>
          <Field label="Text"><Area value={str("dresscodeText")} onChange={set("dresscodeText")} rows={2} /></Field>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
            {dress.map((col, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                <input type="color" value={col} style={s.colorInput}
                  onChange={(e) => onContent({ dresscode: dress.map((x, j) => (j === i ? e.target.value : x)) })} />
                <button type="button" style={s.tinyGhost} onClick={() => onContent({ dresscode: dress.filter((_, j) => j !== i) })}>✕</button>
              </span>
            ))}
            <button type="button" style={s.smallBtn} onClick={() => onContent({ dresscode: [...dress, "#e75480"] })}>+ Color</button>
            {/* dress-code colors are shared across both languages */}
          </div>

          <div style={s.subHead}>Notes</div>
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
        <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="Our moments" /></Field>
      );
    case "khqr":
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="A gift from the heart" /></Field>
          <Field label="Recipient"><Txt value={str("recipientName")} onChange={set("recipientName")} /></Field>
          <Field label="QR image"><ImgField value={strBase("qrImageUrl")} onChange={setBase("qrImageUrl")} /></Field>
        </>
      );
    case "wishing":
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="Wishing wall" /></Field>
          <Field label="Input placeholder"><Txt value={str("placeholder")} onChange={set("placeholder")} /></Field>
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

type EditorTab = "content" | "design" | "buttons" | "guide";

export function ThemeEditor({ event, invitation, themeName, designLocked = false, sectionRows, initialPhotos }: Props) {
  const oc = invitation.overlayConfig ?? {};

  const [tab, setTab] = useState<EditorTab>("content");
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
  // Bilingual content.
  const ocLangs = (oc.languages ?? {}) as { enabled?: boolean; primaryLabel?: string; secondaryLabel?: string };
  const [languages, setLanguages] = useState({
    enabled: ocLangs.enabled ?? false,
    primaryLabel: ocLangs.primaryLabel ?? "ខ្មែរ",
    secondaryLabel: ocLangs.secondaryLabel ?? "EN",
  });
  const [editLang, setEditLang] = useState<"primary" | "secondary">("primary");
  const [sections, setSections] = useState<EditorSection[]>(() => initSections(invitation.defaultSections, sectionRows));
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [open, setOpen] = useState<string | null>("cover0");
  // The section type currently open — drives the live preview's focus.
  const [openType, setOpenType] = useState<string | null>("cover");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const firstFocus = useRef(true);
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [previewV, setPreviewV] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);
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
      monogram,
      scrollGuide: guide.enabled,
      guideText: guide.text,
      guideHand,
      gateBgColor: bg.gateColor || null,
      pageBgColor: bg.pageColor || null,
      backgroundBlur: bg.coverBlur,
      sectionBlur: bg.sectionBlur,
      languages,
    };
    if (Object.keys(colors).length === 0) delete overlayConfig.colorScheme;

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
      setPreviewV((v) => v + 1); // reload the live preview iframe
    } else {
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basics, sections, colors, coverUrl, fonts, fab, monogram, guide, guideHand, bg, languages, event.id]);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setStatus("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [basics, sections, colors, coverUrl, fonts, fab, monogram, guide, guideHand, bg, languages, save]);

  // ── Live preview follows the edited section ────────────────────────────────
  // Cover → reload to the gate view (the gate IS the cover); any other section
  // → tell the running preview to skip the gate and scroll there (no reload).
  useEffect(() => {
    if (firstFocus.current) { firstFocus.current = false; return; }
    if (!openType) return;
    if (openType === "cover") {
      setPreviewV((v) => v + 1);
      return;
    }
    iframeRef.current?.contentWindow?.postMessage({ type: "anjeurn:focus", section: openType }, "*");
  }, [openType]);

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
        setPreviewV((v) => v + 1);
      }
    } finally {
      setGalleryBusy(false);
    }
  }

  async function removeGalleryPhoto(photoId: string) {
    await fetch(`/api/admin/events/${event.id}/photos?photoId=${photoId}`, { method: "DELETE" });
    setPhotos((p) => p.filter((x) => x.id !== photoId));
    setPreviewV((v) => v + 1);
  }

  // ── Section list helpers ───────────────────────────────────────────────────
  const patchSection = (i: number, patch: Partial<EditorSection>) =>
    setSections((ss) => ss.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const patchContent = (i: number, patch: SectionContent) =>
    setSections((ss) => ss.map((x, j) => (j === i ? { ...x, content: { ...x.content, ...patch } } : x)));
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
    idle: "All changes saved", dirty: "Editing…", saving: "Saving…",
    saved: "Saved ✓ — preview updated", error: "Save failed — retrying on next edit",
  }[status];

  return (
    <div style={s.wrap}>
      {/* ── Left: editor panel ──────────────────────────────────────────── */}
      <div style={s.panel}>
        <div style={s.panelHead}>
          <div>
            <h1 style={s.h1}>Content</h1>
            <p style={s.statusLine} data-status={status}>{statusLabel}</p>
          </div>
          <span style={s.themeChip}>
            {themeName}{designLocked ? " 🔒" : ""} · <Link href={`/admin/events/${event.id}/design`} style={s.changeLink}>change</Link>
          </span>
        </div>

        {/* ── Tab bar ── */}
        <div style={s.tabBar}>
          {([
            { id: "content", label: "✒ Content" },
            { id: "design",  label: designLocked ? "🔒 Design" : "🎨 Design" },
            { id: "buttons", label: "◉ Buttons" },
            { id: "guide",   label: "👆 Guide" },
          ] as Array<{ id: EditorTab; label: string }>).map((t) => (
            <button key={t.id} type="button" style={{ ...s.tabBtn, ...(tab === t.id ? s.tabBtnOn : {}) }}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "content" && (
        <>
        {/* Event basics */}
        <div style={s.card}>
          <div style={s.cardTitle}>Event</div>
          <Field label="Title / couple names"><Txt value={basics.title} onChange={(v) => setBasics((b) => ({ ...b, title: v }))} /></Field>
          <Field label="Date & time"><Txt type="datetime-local" value={basics.eventDate} onChange={(v) => setBasics((b) => ({ ...b, eventDate: v }))} /></Field>
          <Field label="Venue"><Txt value={basics.venueName} onChange={(v) => setBasics((b) => ({ ...b, venueName: v }))} /></Field>
          <Field label="Map URL"><Txt value={basics.venueMapUrl} onChange={(v) => setBasics((b) => ({ ...b, venueMapUrl: v }))} /></Field>
          <Field label="Gate / cover background — image, GIF or motion video">
            <MediaField value={coverUrl} onChange={(url) => setCoverUrl(url)} />
          </Field>
          <p style={s.hint}>This is the opening page guests see first (tap to open) — it also backs the cover section.</p>
        </div>

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
                  {sec.type === "image" && (
                    <button type="button" style={s.tinyGhost} title="Remove section"
                      onClick={() => setSections((ss) => ss.filter((_, j) => j !== i))}>✕</button>
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

        {tab === "design" && (designLocked ? (
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
        <div style={s.card}>
          <div style={s.cardTitle}>Font scheme</div>
          <p style={s.hint}>Sets the typography for the whole invitation. Individual sections can fine-tune on top via their “Text style” panel.</p>
          <Field label="Title font — covers, big headings">
            <FontPicker value={fonts.heading} onChange={(v) => setFonts((f) => ({ ...f, heading: v }))} options={HEADING_FONTS} />
          </Field>
          <Field label="Title color">
            <ColorField value={colors.title ?? ""} onChange={(v) => setColors((c) => setOrClear(c, "title", v))} />
          </Field>
          <Field label="Title size">
            <SizeField value={fonts.headingScale} onChange={(v) => setFonts((f) => ({ ...f, headingScale: v }))} />
          </Field>
          <Field label="Header font — section labels">
            <FontPicker value={fonts.header} onChange={(v) => setFonts((f) => ({ ...f, header: v }))} options={HEADING_FONTS} />
          </Field>
          <Field label="Header color">
            <ColorField value={colors.header ?? ""} onChange={(v) => setColors((c) => setOrClear(c, "header", v))} />
          </Field>
          <Field label="Body font — paragraphs & details">
            <FontPicker value={fonts.body} onChange={(v) => setFonts((f) => ({ ...f, body: v }))} options={BODY_FONTS} />
          </Field>
          <Field label="Body color">
            <ColorField value={colors.body ?? ""} onChange={(v) => setColors((c) => setOrClear(c, "body", v))} />
          </Field>
          <Field label="Body size">
            <SizeField value={fonts.bodyScale} onChange={(v) => setFonts((f) => ({ ...f, bodyScale: v }))} />
          </Field>
        </div>

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
        <div style={s.card}>
          <div style={s.cardTitle}>Backgrounds</div>

          <div style={s.subHead}>Cover (opening page)</div>
          <p style={s.hint}>The cover media is uploaded in Content → “Gate / cover background”. Without media, the color below is used.</p>
          <Field label="Plain color (no media)">
            <ColorField value={bg.gateColor} onChange={(v) => setBg((b) => ({ ...b, gateColor: v }))} />
          </Field>
          <Field label="Background blur">
            <SizeField value={bg.coverBlur} onChange={(v) => setBg((b) => ({ ...b, coverBlur: Math.round(v) }))} min={0} max={20} step={1} unit="px" />
          </Field>

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
        </div>

        {/* Monogram placement */}
        <div style={s.card}>
          <div style={s.cardTitle}>Monogram</div>
          <p style={s.hint}>Upload the monogram image in Content → Cover. Choose where it appears:</p>
          <label style={s.checkRow}>
            <input type="checkbox" checked={monogram.gate} onChange={(e) => setMonogram((m) => ({ ...m, gate: e.target.checked }))} />
            On the opening gate (landing screen)
          </label>
          <label style={s.checkRow}>
            <input type="checkbox" checked={monogram.sections} onChange={(e) => setMonogram((m) => ({ ...m, sections: e.target.checked }))} />
            On the cover section (after opening)
          </label>
        </div>
        </>
        ))}

        {tab === "buttons" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Floating buttons</div>
          <p style={s.hint}>The action buttons floating over the invitation (RSVP, gift, map, music).</p>

          <Field label="Position">
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {([["right", "Right stack"], ["left", "Left stack"], ["bar", "Bottom bar"]] as const).map(([v, l]) => (
                <button key={v} type="button"
                  style={{ ...s.smallBtn, ...(fab.position === v ? s.smallBtnOn : {}) }}
                  onClick={() => setFab((f) => ({ ...f, position: v }))}>
                  {l}
                </button>
              ))}
            </div>
          </Field>

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

        {tab === "guide" && (
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

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link href={`/admin/events/${event.id}/guests`} style={s.nextBtn}>Next: Guests →</Link>
        </div>
      </div>

      {/* ── Right: live device preview (the real invite page) ─────────────── */}
      <div style={s.previewCol}>
        <div style={s.previewBar}>
          <span style={{ fontSize: "0.8rem", color: "var(--c-muted)" }}>Live preview — real guest experience</span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button type="button" style={s.smallBtn} onClick={() => setPreviewV((v) => v + 1)}>↻ Reload</button>
            <a href={`/invite/${event.slug}?preview=1`} target="_blank" rel="noreferrer" style={s.smallBtn}>Open ↗</a>
          </div>
        </div>
        <div style={s.phone}>
          <iframe
            key={previewV}
            ref={iframeRef}
            src={`/invite/${event.slug}?preview=1&v=${previewV}${openType && openType !== "cover" ? `&focus=${openType}` : ""}`}
            style={s.phoneScreen}
            title="Live invitation preview"
          />
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = {
  wrap: { display: "flex", gap: "1.5rem", alignItems: "flex-start", maxWidth: 1280, margin: "0 auto" },
  panel: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, gap: "1rem", maxHeight: "calc(100vh - 4rem)", overflowY: "auto" as const, paddingRight: 4 },
  panelHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" },
  h1: { margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--c-text)" },
  statusLine: { margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--c-muted)" },
  themeChip: { fontSize: "0.8rem", fontWeight: 600, color: "var(--c-text)", background: "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: 999, padding: "0.3rem 0.8rem", whiteSpace: "nowrap" as const },
  changeLink: { color: "var(--c-accent)", textDecoration: "none" },
  nextBtn: { padding: "0.55rem 1.25rem", background: "var(--c-accent)", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 },

  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column" as const, gap: "0.6rem" },
  cardTitle: { fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--c-muted)", display: "flex", alignItems: "center" },
  hint: { margin: 0, fontSize: "0.72rem", color: "var(--c-muted)" },
  subHead: { fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--c-muted)", marginTop: "0.5rem" },

  field: { display: "flex", flexDirection: "column" as const, gap: 3 },
  fieldLabel: { fontSize: "0.72rem", fontWeight: 600, color: "var(--c-muted)" },
  input: { width: "100%", boxSizing: "border-box" as const, padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", fontSize: "0.85rem", fontFamily: "inherit" },
  colorInput: { width: 40, height: 26, padding: 0, border: "1px solid var(--c-border)", borderRadius: 6, background: "none", cursor: "pointer" },
  rowGroup: { display: "flex", gap: "0.35rem", alignItems: "center" },

  smallBtn: { padding: "0.35rem 0.7rem", borderRadius: 7, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textDecoration: "none" },
  smallBtnOn: { background: "var(--c-accent)", color: "#fff", border: "1px solid var(--c-accent)" },

  tabBar: { display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--c-border)", paddingBottom: 0 },
  tabBtn: { padding: "0.5rem 0.9rem", border: "none", background: "transparent", color: "var(--c-muted)", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  tabBtnOn: { color: "var(--c-accent)", boxShadow: "inset 0 -2px 0 var(--c-accent)" },

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
  phone: { width: 395, height: 780, margin: "0 auto", borderRadius: 34, border: "10px solid #16181d", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden", background: "#000" },
  phoneScreen: { width: 375, height: 760, border: "none", display: "block" },
} as const;
