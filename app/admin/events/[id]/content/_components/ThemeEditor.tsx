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
}
interface PhotoRow { id: string; url: string }

type SectionContent = Record<string, unknown>;
interface EditorSection { type: string; included: boolean; content: SectionContent }

interface Props {
  event: EventData;
  invitation: InvitationData;
  /** Display name of the active theme (chosen in the Design step). */
  themeName: string;
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
};

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

// ── Per-section content forms ────────────────────────────────────────────────

function SectionForm({ sec, onContent }: { sec: EditorSection; onContent: (patch: SectionContent) => void }) {
  const c = sec.content;
  const str = (k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");
  const set = (k: string) => (v: unknown) => onContent({ [k]: v });

  switch (sec.type) {
    case "cover":
      return (
        <>
          <Field label="Names / heading"><Txt value={str("heading")} onChange={set("heading")} placeholder="Artem + Vika" /></Field>
          <Field label="Intro lines"><Area value={str("subheading")} onChange={set("subheading")} rows={2} placeholder={"We invite you\nto our"} /></Field>
          <Field label="Big word"><Txt value={str("bigWord")} onChange={set("bigWord")} placeholder="wedding" /></Field>
          <Field label="Guest greeting label"><Txt value={str("guestLabel")} onChange={set("guestLabel")} placeholder="Dear" /></Field>
          <Field label="Cover photo"><ImgField value={str("imageUrl")} onChange={set("imageUrl")} /></Field>
        </>
      );
    case "wording":
      return (
        <>
          <Field label="Title"><Txt value={str("title")} onChange={set("title")} placeholder="Guess who?" /></Field>
          <Field label="Text"><Area value={str("text")} onChange={set("text")} rows={4} /></Field>
          <Field label="Photo (optional)"><ImgField value={str("imageUrl")} onChange={set("imageUrl")} /></Field>
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
      const setItems = (next: typeof items) => onContent({ items: next });
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
                onChange={(e) => onContent({ items: items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input value={it.value ?? ""} placeholder="Lesnoy Lane 4…" style={s.input}
                onChange={(e) => onContent({ items: items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <button type="button" style={s.smallGhost} onClick={() => onContent({ items: items.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button type="button" style={s.smallBtn} onClick={() => onContent({ items: [...items, { icon: "📍", label: "", value: "" }] })}>+ Add row</button>
          <Field label="Venue photo"><ImgField value={str("imageUrl")} onChange={set("imageUrl")} /></Field>
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
          </div>

          <div style={s.subHead}>Notes</div>
          {notes.map((n, i) => (
            <div key={i} style={s.rowGroup}>
              <textarea value={n} rows={2} style={{ ...s.input, resize: "vertical" as const }}
                onChange={(e) => onContent({ notes: notes.map((x, j) => (j === i ? e.target.value : x)) })} />
              <button type="button" style={s.smallGhost} onClick={() => onContent({ notes: notes.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button type="button" style={s.smallBtn} onClick={() => onContent({ notes: [...notes, ""] })}>+ Add note</button>
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
          <Field label="QR image"><ImgField value={str("qrImageUrl")} onChange={set("qrImageUrl")} /></Field>
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
}

// ── Color override keys ──────────────────────────────────────────────────────

const COLOR_KEYS: Array<{ key: string; label: string }> = [
  { key: "title",  label: "Titles" },
  { key: "header", label: "Headers" },
  { key: "body",   label: "Body text" },
  { key: "accent", label: "Accent" },
  { key: "text",   label: "Base text" },
  { key: "muted",  label: "Muted" },
];

// ── Main component ───────────────────────────────────────────────────────────

export function ThemeEditor({ event, invitation, themeName, sectionRows, initialPhotos }: Props) {
  const oc = invitation.overlayConfig ?? {};

  const [colors, setColors]     = useState<Record<string, string>>((oc.colorScheme as Record<string, string>) ?? {});
  const [coverUrl, setCoverUrl] = useState(invitation.coverUrl ?? "");
  const [basics, setBasics] = useState({
    title: event.title,
    eventDate: event.eventDate.slice(0, 16),
    venueName: event.venueName ?? "",
    venueMapUrl: event.venueMapUrl ?? "",
  });
  const [sections, setSections] = useState<EditorSection[]>(() => initSections(invitation.defaultSections, sectionRows));
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [open, setOpen] = useState<string | null>("cover");

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
    const overlayConfig: Record<string, unknown> = { ...oc, colorScheme: colors };
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
      }),
    }).catch(() => null);

    if (res?.ok) {
      setStatus("saved");
      setPreviewV((v) => v + 1); // reload the live preview iframe
    } else {
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basics, sections, colors, coverUrl, event.id]);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setStatus("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [basics, sections, colors, coverUrl, save]);

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
            {themeName} · <Link href={`/admin/events/${event.id}/design`} style={s.changeLink}>change</Link>
          </span>
        </div>

        {/* Event basics */}
        <div style={s.card}>
          <div style={s.cardTitle}>Event</div>
          <Field label="Title / couple names"><Txt value={basics.title} onChange={(v) => setBasics((b) => ({ ...b, title: v }))} /></Field>
          <Field label="Date & time"><Txt type="datetime-local" value={basics.eventDate} onChange={(v) => setBasics((b) => ({ ...b, eventDate: v }))} /></Field>
          <Field label="Venue"><Txt value={basics.venueName} onChange={(v) => setBasics((b) => ({ ...b, venueName: v }))} /></Field>
          <Field label="Map URL"><Txt value={basics.venueMapUrl} onChange={(v) => setBasics((b) => ({ ...b, venueMapUrl: v }))} /></Field>
          <Field label="Gate / cover image"><ImgField value={coverUrl} onChange={setCoverUrl} /></Field>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            {COLOR_KEYS.map(({ key, label }) => (
              <label key={key} style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.7rem", color: "var(--c-muted)" }}>
                {label}
                <input type="color" value={colors[key] ?? "#888888"} style={s.colorInput}
                  onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))} />
              </label>
            ))}
          </div>
          <p style={s.hint}>Leave untouched to use the theme&rsquo;s own palette.</p>
        </div>

        {/* Sections */}
        <div style={s.card}>
          <div style={s.cardTitle}>Sections</div>
          {sections.map((sec, i) => {
            const meta = SECTION_META[sec.type] ?? { label: sec.type, icon: "▫" };
            const isOpen = open === sec.type;
            return (
              <div key={sec.type + i} style={s.secBox} data-off={!sec.included}>
                <div style={s.secHead}>
                  <button type="button" style={s.secToggleBtn} onClick={() => setOpen(isOpen ? null : sec.type)}>
                    <span>{meta.icon}</span>
                    <span style={{ fontWeight: 600 }}>{meta.label}</span>
                    <span style={{ marginLeft: "auto", color: "var(--c-muted)" }}>{isOpen ? "▾" : "▸"}</span>
                  </button>
                  <button type="button" style={s.tinyGhost} title="Move up"   onClick={() => move(i, -1)}>↑</button>
                  <button type="button" style={s.tinyGhost} title="Move down" onClick={() => move(i, 1)}>↓</button>
                  <label style={s.incRow} title="Show on invitation">
                    <input type="checkbox" checked={sec.included} onChange={(e) => patchSection(i, { included: e.target.checked })} />
                  </label>
                </div>
                {isOpen && (
                  <div style={s.secBody}>
                    <SectionForm sec={sec} onContent={(patch) => patchContent(i, patch)} />
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
        </div>

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
            src={`/invite/${event.slug}?preview=1&v=${previewV}`}
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
