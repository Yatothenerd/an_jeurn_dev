"use client";

/**
 * EventBuilder — ground-up redesigned invite editor (editor-first).
 *
 * Two equal columns:
 *   • Left  — tabbed editor panel: Setup / Cover / Content (independent scroll)
 *   • Right — live 375×812 device preview: draggable, responsive, real-time,
 *             with Edit-on-screen, Play Animation and Full-screen modes.
 *
 * State persists to the database: Save writes the whole builder state into
 * invitation.overlayConfig.builderDraft (plus event identity + cover image),
 * and the live guest invite renders from that same state via the shared
 * canvas — so the preview matches the real invitation exactly.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { HEADING_FONTS, BODY_FONTS, DEFAULT_FONTS, type FontOption } from "@/lib/themes/shared/standard-css";
import {
  type BuilderState, type Section, type SectionKind, type SectionBlock, type CoverBlock, type AgendaItem,
  type GuideBlock, type GuideState, type Mode, type AnimId, type SectionAnim, type HandAnim, type Interaction,
  type Background, type BgKind, type CoverMoveKind,
  PvSetup, PvCover, PvContent, GuideOverlay, canvasStyles,
} from "@/lib/builder/canvas";

// ── Types ──────────────────────────────────────────────────────────────────────

type TabId = "setup" | "cover" | "content" | "guide";

export interface EventData {
  id: string; title: string; eventType: string; eventDate: string;
  venueName: string | null; venueMapUrl: string | null; slug: string;
}
export interface InvitationData {
  id: string; overlayConfig: Record<string, unknown> | null; isPublished: boolean; shareLink: string | null;
  backgroundUrl?: string | null; backgroundVideoUrl?: string | null; coverUrl?: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Anniversary", "Corporate", "Other"];

const FONT_OPTIONS: FontOption[] = (() => {
  const seen = new Set<string>();
  return [...HEADING_FONTS, ...BODY_FONTS].filter((f) => (seen.has(f.label) ? false : (seen.add(f.label), true)));
})();

const ANIMATIONS: { id: AnimId; label: string; icon: string; desc: string }[] = [
  { id: "fade",     label: "Fade & Zoom",  icon: "✦", desc: "Fades and zooms out" },
  { id: "envelope", label: "Envelope",     icon: "✉", desc: "Folds open from the top" },
  { id: "curtain",  label: "Curtain",      icon: "⛶", desc: "Splits to the sides" },
  { id: "slideUp",  label: "Slide Up",     icon: "↑", desc: "Slides up out of view" },
  { id: "zoomBlur", label: "Zoom Blur",    icon: "❂", desc: "Sharpens in from a blur" },
  { id: "rise",     label: "Rise",         icon: "⤴", desc: "Rises up from below" },
  { id: "flip",     label: "Flip",         icon: "⟳", desc: "Flips open in 3D" },
  { id: "doors",    label: "Doors",        icon: "⊟", desc: "Opens from the centre" },
];

const SECTION_ANIMS: { id: SectionAnim; label: string }[] = [
  { id: "none", label: "None" }, { id: "fade", label: "Fade" }, { id: "slideUp", label: "Slide" }, { id: "zoom", label: "Zoom" },
];

const HAND_PRESETS = ["👆", "☝️", "👇", "🤙", "✋", "🫵", "👈", "👉"];
const HAND_ANIMS: { id: HandAnim; label: string; icon: string }[] = [
  { id: "pulse", label: "Pulse", icon: "◎" },
  { id: "tap",   label: "Tap",   icon: "✸" },
  { id: "drag",  label: "Drag",  icon: "↔" },
];
const INTERACTIONS: { id: Interaction; label: string; icon: string; desc: string; anim: HandAnim }[] = [
  { id: "click", label: "Click Guide", icon: "👆", desc: "Hand taps to open the letter", anim: "tap" },
  { id: "drag",  label: "Drag Guide",  icon: "✋", desc: "Hand drags to guide scrolling", anim: "drag" },
];

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function mkSection(kind: SectionKind, name: string, extra: Partial<Section> = {}): Section {
  return {
    id: uid(), name, kind, visible: true, showTitle: true, mode: "text",
    blocks: [{ id: uid(), text: "", font: DEFAULT_FONTS.body, color: "#ffffff" }],
    columns: 1, imageUrl: "", imageScalePct: 100, agenda: [],
    gallery: [], aba: { qrUrl: "", name: "", note: "" }, map: { url: "", imageUrl: "" },
    wishing: { placeholder: "Leave us a sweet message…" }, anim: "fade", ...extra,
  };
}

const SECTION_LABELS: Record<SectionKind, string> = {
  wording: "Formal Wording", agenda: "Agenda", memory: "Memory", aba: "ABA / KHQR",
  map: "Map", wishing: "Wishing", rsvp: "RSVP", custom: "Custom",
};

function mkGuide(label: string): GuideState {
  return {
    enabled: false,
    interaction: "click",
    blocks: [{ id: uid(), text: label, font: DEFAULT_FONTS.body, color: "#ffffff", xPct: 50, yPct: 56 }],
    hand: { value: "👆", isImage: false, xPct: 50, yPct: 72, anim: "tap" },
  };
}

function freshState(ev: EventData): BuilderState {
  return {
    eventName: ev.title || "",
    eventType: ev.eventType || "Wedding",
    dateTime: ev.eventDate ? new Date(ev.eventDate).toISOString().slice(0, 16) : "",
    langs: { khmer: true, english: true },
    coverBlocks: [
      { id: uid(), text: "We're Getting Married", font: DEFAULT_FONTS.heading, color: "#ffffff", size: 30, pos: { xPct: 50, yPct: 40 } },
      { id: uid(), text: "Join us for our special day", font: DEFAULT_FONTS.body, color: "rgba(255,255,255,0.85)", size: 16, pos: { xPct: 50, yPct: 52 } },
    ],
    openBtnPos: { xPct: 50, yPct: 82 },
    anim: "fade",
    keepCover: true,
    coverBg:   { kind: "color", imageUrl: "", videoUrl: "", color: "#1b2430", blur: 0, opacity: 0.4, overlayColor: "#000000", autoplay: true, lockUntilEnd: false },
    contentBg: { kind: "color", imageUrl: "", videoUrl: "", color: "#11151c", blur: 0, opacity: 0.4, overlayColor: "#000000", autoplay: true, lockUntilEnd: false },
    coverGuide:   mkGuide("Tap to open"),
    contentGuide: mkGuide("Scroll to explore"),
    monogram: { url: "", scalePct: 22, pos: { xPct: 50, yPct: 18 }, showCover: false, showContent: false },
    guestName: { enabled: false, text: "Dear Guest", font: DEFAULT_FONTS.body, color: "#ffffff", size: 18, pos: { xPct: 50, yPct: 66 } },
    sections: [
      mkSection("wording", "Event Formal Wording", { blocks: [{ id: uid(), text: "Together with their families,\nSophea & Dara\nrequest the honour of your presence.", font: DEFAULT_FONTS.body, color: "#ffffff" }] }),
      mkSection("agenda", "Agenda", { anim: "slideUp", agenda: [
        { id: uid(), icon: "💒", showIcon: true, time: "10:00 AM", name: "Ceremony" },
        { id: uid(), icon: "🍽", showIcon: true, time: "12:00 PM", name: "Reception" },
      ] }),
      mkSection("memory", "Memory", { imageScalePct: 48 }),
      mkSection("aba", "ABA"),
      mkSection("map", "Map"),
      mkSection("wishing", "Wishing"),
      mkSection("rsvp", "RSVP"),
    ],
  };
}

// ── Small UI atoms ───────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="eb-pill" data-on={on}>
      <span className="eb-knob" style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }} />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="eb-field">
      <span className="eb-flbl">{label}</span>
      {children}
    </label>
  );
}

function ColorDot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <span className="eb-colordot" style={{ background: value }}>
      <input type="color" value={hex(value)} onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}

function hex(c: string): string {
  if (!c) return "#ffffff";
  if (/^#[0-9a-f]{3,8}$/i.test(c.trim())) return c.trim().slice(0, 7);
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) { const h = (n: number) => (+n).toString(16).padStart(2, "0"); return `#${h(+m[1])}${h(+m[2])}${h(+m[3])}`; }
  return "#ffffff";
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props { event: EventData; invitation: InvitationData | null }

export function EventBuilder({ event, invitation }: Props) {
  const [tab, setTab] = useState<TabId>("setup");
  const [st, setSt] = useState<BuilderState>(() => {
    const base = freshState(event);
    const draft = invitation?.overlayConfig?.builderDraft as
      (Partial<BuilderState> & { bg?: { imageUrl?: string; color?: string; blur?: number; opacity?: number } }) | undefined;
    const seeded: BuilderState = draft && typeof draft === "object" ? { ...base, ...(draft as BuilderState) } : base;

    // Migrate older single-background drafts → split cover/content backgrounds.
    if (draft?.bg && (!draft.coverBg || !draft.contentBg)) {
      const ob = draft.bg;
      const mig: Background = { kind: ob.imageUrl ? "photo" : "color", imageUrl: ob.imageUrl || "", videoUrl: "", color: ob.color || "#11151c", blur: ob.blur || 0, opacity: ob.opacity ?? 0.4, overlayColor: "#000000", autoplay: true, lockUntilEnd: false };
      if (!draft.coverBg) seeded.coverBg = mig;
      if (!draft.contentBg) seeded.contentBg = { ...mig };
    }

    // Normalize older drafts to the current model (positions, overlay color,
    // section text blocks, split guides).
    const fixBg = (b: Background): Background => ({ ...b, overlayColor: b.overlayColor ?? "#000000", autoplay: b.autoplay ?? true, lockUntilEnd: b.lockUntilEnd ?? false });
    seeded.coverBg = fixBg(seeded.coverBg);
    seeded.contentBg = fixBg(seeded.contentBg);
    seeded.coverBlocks = (seeded.coverBlocks ?? base.coverBlocks).map((b, i) => ({ ...b, pos: b.pos ?? { xPct: 50, yPct: 38 + i * 12 } }));
    seeded.openBtnPos = seeded.openBtnPos ?? base.openBtnPos;
    seeded.monogram = seeded.monogram ?? base.monogram;
    seeded.guestName = seeded.guestName ?? base.guestName;
    seeded.sections = (seeded.sections ?? base.sections).map((s) => {
      const old = s as Section & { text?: string; color?: string };
      const blocks: SectionBlock[] = old.blocks && old.blocks.length
        ? old.blocks
        : [{ id: uid(), text: old.text ?? "", font: DEFAULT_FONTS.body, color: old.color ?? "#ffffff" }];
      return {
        ...s, blocks, columns: (s.columns ?? 1) as 1 | 2 | 3, agenda: s.agenda ?? [], anim: s.anim ?? "fade",
        showTitle: s.showTitle ?? true, imageScalePct: s.imageScalePct ?? 100,
        gallery: s.gallery ?? [], aba: s.aba ?? { qrUrl: "", name: "", note: "" },
        map: s.map ?? { url: "", imageUrl: "" }, wishing: s.wishing ?? { placeholder: "Leave us a sweet message…" },
      };
    });
    const oldGuide = (draft as { guide?: GuideState } | undefined)?.guide;
    if (!draft?.coverGuide) seeded.coverGuide = oldGuide ?? base.coverGuide;
    if (!draft?.contentGuide) seeded.contentGuide = base.contentGuide;

    // Link the event's existing saved images into the two backgrounds.
    const coverImg = invitation?.coverUrl || "";
    const pageImg = invitation?.backgroundUrl || invitation?.coverUrl || "";
    if (coverImg && seeded.coverBg.kind === "color" && !seeded.coverBg.imageUrl)
      seeded.coverBg = { ...seeded.coverBg, kind: "photo", imageUrl: coverImg };
    if (pageImg && seeded.contentBg.kind === "color" && !seeded.contentBg.imageUrl)
      seeded.contentBg = { ...seeded.contentBg, kind: "photo", imageUrl: pageImg };
    return seeded;
  });
  const [editOnScreen, setEditOnScreen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [animKey, setAnimKey] = useState(0);          // bump to replay animation
  const [coverOpen, setCoverOpen] = useState(false);  // "Open Ticket" toggles cover→content in preview
  const [guideCtx, setGuideCtx] = useState<"cover" | "content">("cover"); // which guide the Hover Guide tab edits
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const patch = useCallback((p: Partial<BuilderState>) => setSt((s) => ({ ...s, ...p })), []);

  // ── Save: persists the whole builder state to the DB (invitation.overlayConfig
  // .builderDraft drives the live invite). `publish` flips the invite live.
  async function save(publish = false) {
    setSaving(true); setErr("");
    try {
      const imgOf = (b: Background) => ((b.kind === "photo" || b.kind === "gif") && b.imageUrl ? b.imageUrl : undefined);
      const coverUrl = imgOf(st.coverBg);
      const backgroundUrl = imgOf(st.contentBg);
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: st.eventName.trim(), eventType: st.eventType,
          eventDate: st.dateTime ? new Date(st.dateTime).toISOString() : undefined,
          // Non-destructive: keep existing overlay fields, store the builder draft
          // (the live invite renders from this).
          overlayConfig: { ...(invitation?.overlayConfig ?? {}), builderDraft: st },
          isAnimated: true,
          ...(coverUrl ? { coverUrl } : {}),
          ...(backgroundUrl ? { backgroundUrl } : {}),
          ...(publish ? { isPublished: true } : {}),
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || `Save failed (HTTP ${res.status})`);
      }
      setSaved(true); setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setErr((e as Error).message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const replay = () => { setCoverOpen(false); setAnimKey((k) => k + 1); };

  // ── Section helpers
  const setSection = (id: string, p: Partial<Section>) =>
    setSt((s) => ({ ...s, sections: s.sections.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const addSection = (kind: SectionKind = "custom") =>
    setSt((s) => ({ ...s, sections: [...s.sections, mkSection(kind, kind === "custom" ? "New Section" : SECTION_LABELS[kind])] }));
  const removeSection = (id: string) =>
    setSt((s) => ({ ...s, sections: s.sections.filter((x) => x.id !== id) }));
  const moveSection = (from: number, to: number) =>
    setSt((s) => { const a = [...s.sections]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return { ...s, sections: a }; });
  // Content text-block helpers (rows + columns)
  const setBlock = (secId: string, blockId: string, p: Partial<SectionBlock>) =>
    setSt((s) => ({ ...s, sections: s.sections.map((x) => x.id === secId ? { ...x, blocks: x.blocks.map((b) => b.id === blockId ? { ...b, ...p } : b) } : x) }));
  const addBlock = (secId: string) =>
    setSt((s) => ({ ...s, sections: s.sections.map((x) => x.id === secId ? { ...x, blocks: [...x.blocks, { id: uid(), text: "", font: DEFAULT_FONTS.body, color: "#ffffff" }] } : x) }));
  const removeBlock = (secId: string, blockId: string) =>
    setSt((s) => ({ ...s, sections: s.sections.map((x) => x.id === secId ? { ...x, blocks: x.blocks.filter((b) => b.id !== blockId) } : x) }));
  // Live-preview inline edit of a content block
  const editContentBlock = (secId: string, blockId: string, text: string) => setBlock(secId, blockId, { text });

  return (
    <>
      <style>{styles + canvasStyles}</style>

      <div className="eb-root">
        {/* ── LEFT: tabbed editor ─────────────────────────────────────────── */}
        <section className="eb-col eb-editor">
          <div className="eb-tabs">
            {(["setup", "cover", "content", "guide"] as TabId[]).map((id) => (
              <button key={id} type="button" className="eb-tab" data-active={tab === id} onClick={() => setTab(id)}>
                {id === "setup" ? "Setup" : id === "cover" ? "Cover" : id === "content" ? "Content" : "Hover Guide"}
              </button>
            ))}
          </div>

          <div className="eb-panel">
            {tab === "setup" && <SetupTab st={st} patch={patch} />}
            {tab === "cover" && <CoverTab st={st} patch={patch} setSt={setSt} onOpenTicket={() => { setCoverOpen(true); }} onReplay={replay} />}
            {tab === "content" && (
              <ContentTab st={st} patch={patch} setSection={setSection} addSection={addSection}
                removeSection={removeSection} moveSection={moveSection}
                setBlock={setBlock} addBlock={addBlock} removeBlock={removeBlock} />
            )}
            {tab === "guide" && <GuideTab st={st} setSt={setSt} which={guideCtx} setWhich={setGuideCtx} />}
          </div>

          <div className="eb-savebar">
            <span className="eb-muted" style={err ? { color: "#dc2626" } : saved ? { color: "#16a34a" } : undefined}>
              {err ? `⚠ ${err}` : saved ? "✓ Saved to event" : saving ? "Saving…" : "Saved to this event's invitation"}
            </span>
            <div className="eb-rowgap">
              <button type="button" className="eb-btn-ghost" disabled={saving} onClick={() => save(false)}>Save</button>
              {!invitation?.isPublished && (
                <button type="button" className="eb-btn-primary" disabled={saving} onClick={() => save(true)}>Save &amp; Publish ↗</button>
              )}
            </div>
          </div>
        </section>

        {/* ── RIGHT: live preview ─────────────────────────────────────────── */}
        <section className="eb-col eb-previewcol">
          <PreviewToolbar
            editOnScreen={editOnScreen} setEditOnScreen={setEditOnScreen}
            onPlay={replay} onFullscreen={() => setFullscreen(true)}
          />
          <DraggableStage>
            <DeviceFrame
              st={st} tab={tab} animKey={animKey} coverOpen={coverOpen} setCoverOpen={setCoverOpen}
              editOnScreen={editOnScreen} setSt={setSt} moveSection={moveSection} guideCtx={guideCtx}
            />
          </DraggableStage>
        </section>
      </div>

      {/* ── Fullscreen modal preview ──────────────────────────────────────── */}
      {fullscreen && (
        <div className="eb-overlay" onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false); }}>
          <div className="eb-overlay-inner">
            <PreviewToolbar
              editOnScreen={editOnScreen} setEditOnScreen={setEditOnScreen}
              onPlay={replay} onClose={() => setFullscreen(false)}
            />
            <DeviceFrame
              st={st} tab={tab} animKey={animKey} coverOpen={coverOpen} setCoverOpen={setCoverOpen}
              editOnScreen={editOnScreen} setSt={setSt} moveSection={moveSection} guideCtx={guideCtx} big
            />
          </div>
        </div>
      )}
    </>
  );
}

// ── Setup tab ────────────────────────────────────────────────────────────────

function SetupTab({ st, patch }: { st: BuilderState; patch: (p: Partial<BuilderState>) => void }) {
  return (
    <div className="eb-stack">
      <div className="eb-card">
        <div className="eb-cardhead">Event Setup</div>
        <Field label="Event name">
          <input className="eb-input" value={st.eventName} onChange={(e) => patch({ eventName: e.target.value })} placeholder="Sophea & Dara's Wedding" />
        </Field>
        <Field label="Event type">
          <select className="eb-input" value={st.eventType} onChange={(e) => patch({ eventType: e.target.value })}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Date & time">
          <input type="datetime-local" className="eb-input" value={st.dateTime} onChange={(e) => patch({ dateTime: e.target.value })} />
        </Field>
        <div className="eb-field">
          <span className="eb-flbl">Languages</span>
          <div className="eb-checkrow">
            {(["khmer", "english"] as const).map((k) => (
              <label key={k} className="eb-check" data-on={st.langs[k]}>
                <input type="checkbox" checked={st.langs[k]} onChange={(e) => patch({ langs: { ...st.langs, [k]: e.target.checked } })} />
                <span>{k === "khmer" ? "ខ្មែរ Khmer" : "English"}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cover tab ────────────────────────────────────────────────────────────────

function CoverTab({ st, patch, setSt, onOpenTicket, onReplay }: {
  st: BuilderState; patch: (p: Partial<BuilderState>) => void;
  setSt: React.Dispatch<React.SetStateAction<BuilderState>>;
  onOpenTicket: () => void; onReplay: () => void;
}) {
  const setBlock = (id: string, p: Partial<CoverBlock>) =>
    setSt((s) => ({ ...s, coverBlocks: s.coverBlocks.map((b) => (b.id === id ? { ...b, ...p } : b)) }));
  const addBlock = () =>
    setSt((s) => ({ ...s, coverBlocks: [...s.coverBlocks, { id: uid(), text: "New text", font: DEFAULT_FONTS.body, color: "#ffffff", size: 18, pos: { xPct: 50, yPct: 60 } }] }));
  const removeBlock = (id: string) =>
    setSt((s) => ({ ...s, coverBlocks: s.coverBlocks.filter((b) => b.id !== id) }));

  return (
    <div className="eb-stack">
      <div className="eb-card">
        <div className="eb-cardhead">Event name</div>
        <div className="eb-readonly">{st.eventName || "—"}</div>
      </div>

      {/* Cover background — separate from the content background */}
      <div className="eb-card">
        <div className="eb-cardhead">Cover Background</div>
        <BackgroundEditor value={st.coverBg} onChange={(b) => patch({ coverBg: b })} />
      </div>

      {/* Monogram / logo — shared across cover & content */}
      <div className="eb-card">
        <div className="eb-cardhead">Monogram / Logo</div>
        <UploadBox label="Logo / monogram image" accept="image/png,image/webp,image/svg+xml,image/jpeg" value={st.monogram.url} onChange={(url) => patch({ monogram: { ...st.monogram, url } })} />
        <Slider label="Size" min={6} max={60} suffix="%" value={st.monogram.scalePct} onChange={(v) => patch({ monogram: { ...st.monogram, scalePct: v } })} />
        <div className="eb-rowbetween"><span className="eb-flbl">Show on cover</span><Toggle on={st.monogram.showCover} onChange={(v) => patch({ monogram: { ...st.monogram, showCover: v } })} /></div>
        <div className="eb-rowbetween"><span className="eb-flbl">Show on Formal Wording</span><Toggle on={st.monogram.showContent} onChange={(v) => patch({ monogram: { ...st.monogram, showContent: v } })} /></div>
        <p className="eb-muted eb-sm" style={{ margin: 0 }}>On the cover, drag it to position. On content it sits atop the Formal Wording section.</p>
      </div>

      {/* Guest name preset */}
      <div className="eb-card">
        <div className="eb-cardhead eb-rowbetween">Guest name <Toggle on={st.guestName.enabled} onChange={(v) => patch({ guestName: { ...st.guestName, enabled: v } })} /></div>
        {st.guestName.enabled && (
          <div className="eb-stack">
            <Field label="Placeholder text"><input className="eb-input" value={st.guestName.text} onChange={(e) => patch({ guestName: { ...st.guestName, text: e.target.value } })} /></Field>
            <div className="eb-blockctl">
              <select className="eb-input eb-fontsel" style={{ fontFamily: st.guestName.font }} value={st.guestName.font} onChange={(e) => patch({ guestName: { ...st.guestName, font: e.target.value } })}>
                {FONT_OPTIONS.map((f) => <option key={f.label} value={f.stack} style={{ fontFamily: f.stack }}>{f.label}</option>)}
              </select>
              <ColorDot value={st.guestName.color} onChange={(v) => patch({ guestName: { ...st.guestName, color: v } })} />
            </div>
            <Slider label="Size" min={11} max={40} suffix="px" value={st.guestName.size} onChange={(v) => patch({ guestName: { ...st.guestName, size: v } })} />
            <p className="eb-muted eb-sm" style={{ margin: 0 }}>The guest&apos;s real name replaces this on the live invite. Drag on the preview to position.</p>
          </div>
        )}
      </div>

      <div className="eb-card">
        <div className="eb-cardhead eb-rowbetween">Text blocks <button type="button" className="eb-add" onClick={addBlock}>+ Add block</button></div>
        <div className="eb-stack">
          {st.coverBlocks.map((b) => (
            <div key={b.id} className="eb-block">
              <input className="eb-input" value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} placeholder="Text…" />
              <div className="eb-blockctl">
                <select className="eb-input eb-fontsel" style={{ fontFamily: b.font }} value={b.font} onChange={(e) => setBlock(b.id, { font: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.label} value={f.stack} style={{ fontFamily: f.stack }}>{f.label}</option>)}
                </select>
                <input type="range" min={11} max={48} value={b.size} onChange={(e) => setBlock(b.id, { size: +e.target.value })} className="eb-range" title="Size" />
                <ColorDot value={b.color} onChange={(v) => setBlock(b.id, { color: v })} />
                <button type="button" className="eb-iconbtn eb-danger" title="Remove" onClick={() => removeBlock(b.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="eb-card">
        <div className="eb-cardhead">Animation style</div>
        <div className="eb-animgrid">
          {ANIMATIONS.map((a) => (
            <button key={a.id} type="button" className="eb-animbox" data-on={st.anim === a.id} onClick={() => patch({ anim: a.id })}>
              <span className="eb-animicon">{a.icon}</span>
              <span className="eb-animlbl">{a.label}</span>
              <span className="eb-animdesc">{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="eb-card eb-rowbetween">
        <div><div className="eb-flbl">Keep cover visible after open</div><div className="eb-muted eb-sm">Cover stays as the first screen on scroll</div></div>
        <Toggle on={st.keepCover} onChange={(v) => patch({ keepCover: v })} />
      </div>

      <div className="eb-rowgap">
        <button type="button" className="eb-btn-primary" onClick={onOpenTicket}>🎟 Open Ticket</button>
        <button type="button" className="eb-btn-ghost" onClick={onReplay}>▶ Replay animation</button>
      </div>
    </div>
  );
}

// ── Content tab ──────────────────────────────────────────────────────────────

function ContentTab({ st, patch, setSection, addSection, removeSection, moveSection, setBlock, addBlock, removeBlock }: {
  st: BuilderState; patch: (p: Partial<BuilderState>) => void;
  setSection: (id: string, p: Partial<Section>) => void;
  addSection: (kind?: SectionKind) => void; removeSection: (id: string) => void;
  moveSection: (from: number, to: number) => void;
  setBlock: (secId: string, blockId: string, p: Partial<SectionBlock>) => void;
  addBlock: (secId: string) => void; removeBlock: (secId: string, blockId: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(st.sections[0]?.id ?? null);
  const dragFrom = useRef<number | null>(null);

  return (
    <div className="eb-stack">
      {/* Content background — separate from the cover background */}
      <div className="eb-card">
        <div className="eb-cardhead">Content Background</div>
        <BackgroundEditor value={st.contentBg} onChange={(b) => patch({ contentBg: b })} />
      </div>

      {/* Section panels */}
      <div className="eb-stack">
        {st.sections.map((sec, i) => {
          const open = openId === sec.id;
          return (
            <div key={sec.id} className="eb-section" data-open={open}
              draggable onDragStart={() => (dragFrom.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragFrom.current !== null && dragFrom.current !== i) moveSection(dragFrom.current, i); dragFrom.current = null; }}>
              <div className="eb-sechead">
                <span className="eb-grip" title="Drag to reorder">⠿</span>
                <input className="eb-secname" value={sec.name} onChange={(e) => setSection(sec.id, { name: e.target.value })} />
                <button type="button" className="eb-iconbtn" data-on={sec.showTitle} title={sec.showTitle ? "Hide section title" : "Show section title"} onClick={() => setSection(sec.id, { showTitle: !sec.showTitle })}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>T</span>
                </button>
                <button type="button" className="eb-iconbtn" title={sec.visible ? "Hide section" : "Show section"} onClick={() => setSection(sec.id, { visible: !sec.visible })}>
                  {sec.visible ? "👁" : "🚫"}
                </button>
                <button type="button" className="eb-iconbtn" title="Expand" onClick={() => setOpenId(open ? null : sec.id)}>
                  <span style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
                </button>
              </div>

              {open && (
                <div className="eb-secbody">
                  <div className="eb-seg eb-segsm">
                    {(["photo", "text"] as Mode[]).map((m) => (
                      <button key={m} type="button" className="eb-segbtn" data-on={sec.mode === m} onClick={() => setSection(sec.id, { mode: m })}>
                        {m === "photo" ? "🖼 Photo" : "✏️ Content"}
                      </button>
                    ))}
                  </div>

                  <div className="eb-rowbetween">
                    <span className="eb-flbl">Section animation</span>
                    <select className="eb-input" style={{ width: 130 }} value={sec.anim} onChange={(e) => setSection(sec.id, { anim: e.target.value as SectionAnim })}>
                      {SECTION_ANIMS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </div>

                  <SectionKindEditor sec={sec} setSection={setSection} setBlock={setBlock} addBlock={addBlock} removeBlock={removeBlock} />

                  {sec.kind === "custom" && (
                    <button type="button" className="eb-removelink" onClick={() => removeSection(sec.id)}>Remove section</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <select className="eb-input eb-addsection" value="" onChange={(e) => { if (e.target.value) addSection(e.target.value as SectionKind); }}>
          <option value="">+ Add section…</option>
          {(["wording", "agenda", "memory", "aba", "map", "wishing", "rsvp", "custom"] as SectionKind[]).map((k) => (
            <option key={k} value={k}>{SECTION_LABELS[k]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AgendaEditor({ sec, setSection }: { sec: Section; setSection: (id: string, p: Partial<Section>) => void }) {
  const set = (iid: string, p: Partial<AgendaItem>) =>
    setSection(sec.id, { agenda: sec.agenda.map((a) => (a.id === iid ? { ...a, ...p } : a)) });
  const add = () => setSection(sec.id, { agenda: [...sec.agenda, { id: uid(), icon: "📌", showIcon: true, time: "", name: "" }] });
  const rm = (iid: string) => setSection(sec.id, { agenda: sec.agenda.filter((a) => a.id !== iid) });
  return (
    <div className="eb-stack">
      {sec.agenda.map((a) => (
        <div key={a.id} className="eb-agenda">
          <div className="eb-agendatop">
            <label className="eb-iconup" title="Upload / set icon" data-off={!a.showIcon}>
              <span>{a.icon || "＋"}</span>
              <input value={a.icon} onChange={(e) => set(a.id, { icon: e.target.value.slice(0, 2) })} />
            </label>
            <input className="eb-input" style={{ width: 100 }} placeholder="Time" value={a.time} onChange={(e) => set(a.id, { time: e.target.value })} />
            <input className="eb-input" placeholder="Event name" value={a.name} onChange={(e) => set(a.id, { name: e.target.value })} />
            <button type="button" className="eb-iconbtn eb-danger" onClick={() => rm(a.id)}>✕</button>
          </div>
          <label className="eb-minitoggle">
            <Toggle on={a.showIcon} onChange={(v) => set(a.id, { showIcon: v })} />
            <span className="eb-sm eb-muted">Show icon</span>
          </label>
        </div>
      ))}
      <button type="button" className="eb-add" onClick={add}>+ Add agenda item</button>
    </div>
  );
}

function GalleryEditor({ sec, setSection }: { sec: Section; setSection: (id: string, p: Partial<Section>) => void }) {
  return (
    <div className="eb-stack">
      <Slider label="Photo size" min={20} max={100} suffix="%" value={sec.imageScalePct} onChange={(v) => setSection(sec.id, { imageScalePct: v })} />
      {sec.gallery.length > 0 && (
        <div className="eb-galgrid">
          {sec.gallery.map((url, gi) => (
            <div key={gi} className="eb-galcell">
              <img src={url} alt="" />
              <button type="button" onClick={() => setSection(sec.id, { gallery: sec.gallery.filter((_, j) => j !== gi) })}>✕</button>
            </div>
          ))}
        </div>
      )}
      <UploadBox label="Add photo" value="" onChange={(url) => setSection(sec.id, { gallery: [...sec.gallery, url] })} />
    </div>
  );
}

// Per-kind section editor (photo/text for freeform sections, dedicated UI for the rest).
function SectionKindEditor({ sec, setSection, setBlock, addBlock, removeBlock }: {
  sec: Section; setSection: (id: string, p: Partial<Section>) => void;
  setBlock: (secId: string, blockId: string, p: Partial<SectionBlock>) => void;
  addBlock: (secId: string) => void; removeBlock: (secId: string, blockId: string) => void;
}) {
  if (sec.mode === "photo") {
    return (
      <div className="eb-stack">
        <UploadBox label="Section image" value={sec.imageUrl} onChange={(url) => setSection(sec.id, { imageUrl: url })} />
        <Slider label="Photo size" min={20} max={100} suffix="%" value={sec.imageScalePct} onChange={(v) => setSection(sec.id, { imageScalePct: v })} />
      </div>
    );
  }
  switch (sec.kind) {
    case "agenda": return <AgendaEditor sec={sec} setSection={setSection} />;
    case "memory": return <GalleryEditor sec={sec} setSection={setSection} />;
    case "aba": return (
      <div className="eb-stack">
        <UploadBox label="KHQR / QR image" value={sec.aba.qrUrl} onChange={(url) => setSection(sec.id, { aba: { ...sec.aba, qrUrl: url } })} />
        <Slider label="QR size" min={20} max={100} suffix="%" value={sec.imageScalePct} onChange={(v) => setSection(sec.id, { imageScalePct: v })} />
        <Field label="Recipient name"><input className="eb-input" value={sec.aba.name} onChange={(e) => setSection(sec.id, { aba: { ...sec.aba, name: e.target.value } })} placeholder="Sophea & Dara" /></Field>
        <Field label="Note"><input className="eb-input" value={sec.aba.note} onChange={(e) => setSection(sec.id, { aba: { ...sec.aba, note: e.target.value } })} placeholder="Scan to send a gift" /></Field>
      </div>
    );
    case "map": return (
      <div className="eb-stack">
        <Field label="Map link (Google Maps URL)"><input className="eb-input" value={sec.map.url} onChange={(e) => setSection(sec.id, { map: { ...sec.map, url: e.target.value } })} placeholder="https://maps.google.com/…" /></Field>
        <UploadBox label="Map image (optional)" value={sec.map.imageUrl} onChange={(url) => setSection(sec.id, { map: { ...sec.map, imageUrl: url } })} />
      </div>
    );
    case "wishing": return (
      <Field label="Input placeholder"><input className="eb-input" value={sec.wishing.placeholder} onChange={(e) => setSection(sec.id, { wishing: { ...sec.wishing, placeholder: e.target.value } })} /></Field>
    );
    case "rsvp": return <p className="eb-muted eb-sm" style={{ margin: 0 }}>Shows an RSVP button on the invitation. Responses appear under the event&apos;s guest list.</p>;
    default: return (
      <div className="eb-stack">
        {sec.blocks.map((bl) => (
          <div key={bl.id} className="eb-block">
            <textarea className="eb-input eb-textarea" value={bl.text} onChange={(e) => setBlock(sec.id, bl.id, { text: e.target.value })} placeholder="Text…" />
            <div className="eb-blockctl">
              <select className="eb-input eb-fontsel" style={{ fontFamily: bl.font }} value={bl.font} onChange={(e) => setBlock(sec.id, bl.id, { font: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f.label} value={f.stack} style={{ fontFamily: f.stack }}>{f.label}</option>)}
              </select>
              <ColorDot value={bl.color} onChange={(v) => setBlock(sec.id, bl.id, { color: v })} />
              <button type="button" className="eb-iconbtn" title={bl.nowrap ? "No-wrap (tap to wrap)" : "Wrap (tap for no-wrap)"} onClick={() => setBlock(sec.id, bl.id, { nowrap: !bl.nowrap })}>{bl.nowrap ? "→" : "↵"}</button>
              {sec.blocks.length > 1 && <button type="button" className="eb-iconbtn eb-danger" title="Remove row" onClick={() => removeBlock(sec.id, bl.id)}>✕</button>}
            </div>
          </div>
        ))}
        <div className="eb-rowbetween">
          <button type="button" className="eb-add" onClick={() => addBlock(sec.id)}>+ Add row</button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="eb-flbl">Columns</span>
            <div className="eb-seg eb-segsm" style={{ width: 120 }}>
              {([1, 2, 3] as const).map((n) => (
                <button key={n} type="button" className="eb-segbtn" data-on={sec.columns === n} onClick={() => setSection(sec.id, { columns: n })}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// ── Hover Guide tab ──────────────────────────────────────────────────────────

function GuideTab({ st, setSt, which, setWhich }: {
  st: BuilderState; setSt: React.Dispatch<React.SetStateAction<BuilderState>>;
  which: "cover" | "content"; setWhich: (w: "cover" | "content") => void;
}) {
  const key = which === "cover" ? "coverGuide" : "contentGuide";
  const g = st[key];
  const setG = (p: Partial<GuideState>) => setSt((s) => ({ ...s, [key]: { ...s[key], ...p } }));
  const setBlock = (id: string, p: Partial<GuideBlock>) =>
    setG({ blocks: g.blocks.map((b) => (b.id === id ? { ...b, ...p } : b)) });
  const addBlock = () =>
    setG({ blocks: [...g.blocks, { id: uid(), text: "Click here", font: DEFAULT_FONTS.body, color: "#ffffff", xPct: 50, yPct: 45 }] });
  const removeBlock = (id: string) => setG({ blocks: g.blocks.filter((b) => b.id !== id) });

  return (
    <div className="eb-stack">
      <div className="eb-seg">
        {(["cover", "content"] as const).map((w) => (
          <button key={w} type="button" className="eb-segbtn" data-on={which === w} onClick={() => setWhich(w)}>
            {w === "cover" ? "Cover guide" : "Content guide"}
          </button>
        ))}
      </div>

      <div className="eb-card eb-rowbetween">
        <div><div className="eb-flbl">Enable {which} hover guide</div><div className="eb-muted eb-sm">Teach guests how to interact — disappears once they tap or drag</div></div>
        <Toggle on={g.enabled} onChange={(v) => setG({ enabled: v })} />
      </div>

      <div className="eb-card">
        <div className="eb-cardhead">Interaction type</div>
        <div className="eb-animgrid">
          {INTERACTIONS.map((it) => (
            <button key={it.id} type="button" className="eb-animbox" data-on={g.interaction === it.id}
              onClick={() => setG({ interaction: it.id, hand: { ...g.hand, anim: it.anim } })}>
              <span className="eb-animicon">{it.icon}</span>
              <span className="eb-animlbl">{it.label}</span>
              <span className="eb-animdesc">{it.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="eb-card">
        <div className="eb-cardhead eb-rowbetween">Instruction text blocks <button type="button" className="eb-add" onClick={addBlock}>+ Add block</button></div>
        <div className="eb-stack">
          {g.blocks.map((b) => (
            <div key={b.id} className="eb-block">
              <input className="eb-input" value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} placeholder="e.g. Click here to open" />
              <div className="eb-blockctl">
                <select className="eb-input eb-fontsel" style={{ fontFamily: b.font }} value={b.font} onChange={(e) => setBlock(b.id, { font: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.label} value={f.stack} style={{ fontFamily: f.stack }}>{f.label}</option>)}
                </select>
                <ColorDot value={b.color} onChange={(v) => setBlock(b.id, { color: v })} />
                <button type="button" className="eb-iconbtn eb-danger" title="Remove" onClick={() => removeBlock(b.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <p className="eb-muted eb-sm" style={{ margin: 0 }}>Drag each block on the preview to position it.</p>
      </div>

      <div className="eb-card">
        <div className="eb-cardhead">Hand symbol</div>
        <div className="eb-handgrid">
          {HAND_PRESETS.map((h) => (
            <button key={h} type="button" className="eb-handbtn" data-on={!g.hand.isImage && g.hand.value === h}
              onClick={() => setG({ hand: { ...g.hand, value: h, isImage: false } })}>{h}</button>
          ))}
        </div>
        <UploadBox label="Upload hand icon (SVG/PNG)" value={g.hand.isImage ? g.hand.value : ""}
          onChange={(url) => setG({ hand: { ...g.hand, value: url, isImage: true } })} />
        <div className="eb-field">
          <span className="eb-flbl">Motion</span>
          <div className="eb-seg">
            {HAND_ANIMS.map((a) => (
              <button key={a.id} type="button" className="eb-segbtn" data-on={g.hand.anim === a.id} onClick={() => setG({ hand: { ...g.hand, anim: a.id } })}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </div>
        <p className="eb-muted eb-sm" style={{ margin: 0 }}>Drag the hand on the preview to position it.</p>
      </div>
    </div>
  );
}

// ── Editor helpers ───────────────────────────────────────────────────────────

function Slider({ label, value, onChange, min, max, suffix }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; suffix?: string }) {
  const v = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  return (
    <div className="eb-field">
      <div className="eb-rowbetween"><span className="eb-flbl">{label}</span><span className="eb-sm eb-muted">{Math.round(v)}{suffix}</span></div>
      <input type="range" min={min} max={max} value={v} onChange={(e) => onChange(+e.target.value)} className="eb-range" />
    </div>
  );
}

function UploadBox({ label, value, onChange, accept = "image/*" }: { label: string; value: string; onChange: (url: string) => void; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isVideo = accept.includes("video");
  async function handle(file: File) {
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", isVideo ? "builder/video" : "builder");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = (await res.json()) as { url?: string };
      if (j.url) onChange(j.url);
    } catch { /* ignore */ } finally { setBusy(false); }
  }
  return (
    <div className="eb-upload" onClick={() => ref.current?.click()}>
      {value
        ? (isVideo ? <video src={value} className="eb-uploadimg" muted /> : <img src={value} alt="" className="eb-uploadimg" />)
        : <span className="eb-uploadph">{busy ? "Uploading…" : `⬆ ${label}`}</span>}
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
    </div>
  );
}

// Reusable background editor (color / photo / gif / video) used by Cover & Content.
function BackgroundEditor({ value, onChange }: { value: Background; onChange: (b: Background) => void }) {
  const set = (p: Partial<Background>) => onChange({ ...value, ...p });
  return (
    <div className="eb-stack">
      <div className="eb-seg">
        {(["color", "photo", "gif", "video"] as BgKind[]).map((k) => (
          <button key={k} type="button" className="eb-segbtn" data-on={value.kind === k} onClick={() => set({ kind: k })}>
            {k === "color" ? "🎨 Color" : k === "photo" ? "🖼 Photo" : k === "gif" ? "📲 GIF" : "🎬 Video"}
          </button>
        ))}
      </div>
      {value.kind === "color" ? (
        <div className="eb-rowbetween"><span className="eb-flbl">Background color</span><ColorDot value={value.color} onChange={(v) => set({ color: v })} /></div>
      ) : (
        <>
          {value.kind === "video"
            ? <UploadBox label="Background video (MP4 / WebM)" accept="video/mp4,video/webm" value={value.videoUrl} onChange={(url) => set({ videoUrl: url })} />
            : <UploadBox label={value.kind === "gif" ? "Background GIF" : "Background image"} accept={value.kind === "gif" ? "image/gif" : "image/jpeg,image/png,image/webp"} value={value.imageUrl} onChange={(url) => set({ imageUrl: url })} />}
          {value.kind === "video" && (
            <div className="eb-stack">
              <div className="eb-rowbetween"><span className="eb-flbl">Auto-play</span><Toggle on={value.autoplay} onChange={(v) => set({ autoplay: v })} /></div>
              <div className="eb-rowbetween">
                <div><div className="eb-flbl">Lock until video ends</div><div className="eb-muted eb-sm">No tap / drag until the clip finishes</div></div>
                <Toggle on={value.lockUntilEnd} onChange={(v) => set({ lockUntilEnd: v })} />
              </div>
            </div>
          )}
          <Slider label="Blur" min={0} max={40} suffix="px" value={value.blur} onChange={(v) => set({ blur: v })} />
          <div className="eb-rowbetween"><span className="eb-flbl">Overlay color</span><ColorDot value={value.overlayColor} onChange={(v) => set({ overlayColor: v })} /></div>
          <Slider label="Overlay opacity" min={0} max={100} suffix="%" value={Math.round(value.opacity * 100)} onChange={(v) => set({ opacity: v / 100 })} />
        </>
      )}
    </div>
  );
}

// ── Preview toolbar ──────────────────────────────────────────────────────────

function PreviewToolbar({ editOnScreen, setEditOnScreen, onPlay, onFullscreen, onClose }: {
  editOnScreen: boolean; setEditOnScreen: (v: boolean) => void;
  onPlay: () => void; onFullscreen?: () => void; onClose?: () => void;
}) {
  return (
    <div className="eb-pvtoolbar">
      <button type="button" className="eb-chip" data-on={editOnScreen} onClick={() => setEditOnScreen(!editOnScreen)}>✎ Edit on screen</button>
      <button type="button" className="eb-chip" onClick={onPlay}>▶ Play</button>
      {onFullscreen && <button type="button" className="eb-chip" onClick={onFullscreen}>⛶ Full screen</button>}
      {onClose && <button type="button" className="eb-chip" onClick={onClose}>✕ Close</button>}
    </div>
  );
}

// ── Draggable stage — lets the device frame be dragged around the column ──────

function DraggableStage({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({ x: drag.current.ox + (e.clientX - drag.current.sx), y: drag.current.oy + (e.clientY - drag.current.sy) });
  };
  const onUp = () => { drag.current = null; };

  return (
    <div className="eb-stage">
      <div className="eb-draghandle" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} title="Drag the preview">
        ✥ Drag preview {(pos.x || pos.y) ? <button type="button" className="eb-resetpos" onClick={() => setPos({ x: 0, y: 0 })}>reset</button> : null}
      </div>
      <div style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: drag.current ? "none" : "transform .15s" }}>
        {children}
      </div>
    </div>
  );
}

// ── Device frame (375×812) ───────────────────────────────────────────────────

function DeviceFrame({ st, tab, animKey, coverOpen, setCoverOpen, editOnScreen, setSt, moveSection, guideCtx, big }: {
  st: BuilderState; tab: TabId; animKey: number; coverOpen: boolean; setCoverOpen: (v: boolean) => void;
  editOnScreen: boolean; setSt: React.Dispatch<React.SetStateAction<BuilderState>>;
  moveSection: (from: number, to: number) => void; guideCtx: "cover" | "content"; big?: boolean;
}) {
  // Responsive scale: shrink the 375px frame to fit its container.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (big) { setScale(1); return; }
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth;
      setScale(Math.min(1, Math.max(0.5, avail / 391)));   // 375 + 16 frame padding
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [big]);

  const moveCover = (kind: CoverMoveKind, id: string | undefined, xPct: number, yPct: number) =>
    setSt((s) => {
      if (kind === "open") return { ...s, openBtnPos: { xPct, yPct } };
      if (kind === "mono") return { ...s, monogram: { ...s.monogram, pos: { xPct, yPct } } };
      if (kind === "guest") return { ...s, guestName: { ...s.guestName, pos: { xPct, yPct } } };
      return { ...s, coverBlocks: s.coverBlocks.map((b) => (b.id === id ? { ...b, pos: { xPct, yPct } } : b)) };
    });
  const editContentBlock = (secId: string, blockId: string, text: string) =>
    setSt((s) => ({ ...s, sections: s.sections.map((x) => x.id === secId ? { ...x, blocks: x.blocks.map((b) => b.id === blockId ? { ...b, text } : b) } : x) }));
  const moveGuide = (kind: "hand" | "block", id: string | undefined, xPct: number, yPct: number) => {
    const key = guideCtx === "cover" ? "coverGuide" : "contentGuide";
    setSt((s) => kind === "hand"
      ? { ...s, [key]: { ...s[key], hand: { ...s[key].hand, xPct, yPct } } }
      : { ...s, [key]: { ...s[key], blocks: s[key].blocks.map((b) => (b.id === id ? { ...b, xPct, yPct } : b)) } });
  };

  return (
    <div ref={wrapRef} className="eb-framewrap">
      <div className="eb-device" style={{ transform: `scale(${big ? 1 : scale})` }} data-anim={st.anim} key={animKey}>
        {/* status bar */}
        <div className="eb-statusbar">
          <span>9:41</span>
          <span className="eb-notch" />
          <span>▮▮▮ 􀛨</span>
        </div>
        <div className="eb-screen">
          {tab === "setup" && <PvSetup st={st} />}

          {tab === "cover" && (coverOpen
            ? <PvContent st={st} editable={editOnScreen} onEditBlock={editContentBlock} onReorder={moveSection} />
            : <PvCover st={st} editable onMoveCover={moveCover} onOpen={() => setCoverOpen(true)} animKey={animKey} />)}
          {tab === "cover" && !coverOpen && st.coverGuide.enabled && <GuideOverlay guide={st.coverGuide} />}

          {tab === "content" && <PvContent st={st} editable={editOnScreen} onEditBlock={editContentBlock} onReorder={moveSection} />}
          {tab === "content" && st.contentGuide.enabled && <GuideOverlay guide={st.contentGuide} />}

          {/* Guide tab: edit the selected guide over its matching backdrop */}
          {tab === "guide" && (guideCtx === "cover" ? <PvCover st={st} animKey={animKey} /> : <PvContent st={st} />)}
          {tab === "guide" && (
            <GuideOverlay guide={guideCtx === "cover" ? st.coverGuide : st.contentGuide} editable onMove={moveGuide} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = `
.eb-root { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
@media (max-width: 920px) { .eb-root { grid-template-columns: 1fr; } }

.eb-col { min-width: 0; }
.eb-editor { display: flex; flex-direction: column; gap: 0.875rem; }

/* Tabs */
.eb-tabs { display: flex; gap: 0.25rem; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 12px; padding: 0.375rem; position: sticky; top: 3.5rem; z-index: 5; }
.eb-tab { flex: 1; padding: 0.6rem; border: none; background: transparent; color: var(--c-muted); border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; font-family: inherit; transition: background .15s, color .15s; }
.eb-tab:hover { color: var(--c-text); background: var(--c-surface-2); }
.eb-tab[data-active="true"] { background: var(--c-accent); color: #fff; }

/* Editor panel — independent scroll */
.eb-panel { max-height: calc(100vh - 14rem); overflow-y: auto; padding-right: 0.25rem; }
@media (max-width: 920px) { .eb-panel { max-height: none; } }

.eb-stack { display: flex; flex-direction: column; gap: 0.875rem; }
.eb-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.eb-cardhead { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-muted); }
.eb-rowbetween { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.eb-rowgap { display: flex; gap: 0.625rem; flex-wrap: wrap; }
.eb-readonly { font-size: 1.05rem; font-weight: 600; color: var(--c-text); }
.eb-muted { color: var(--c-muted); } .eb-sm { font-size: 0.75rem; }

.eb-field { display: flex; flex-direction: column; gap: 0.375rem; }
.eb-flbl { font-size: 0.8125rem; font-weight: 600; color: var(--c-text); }
.eb-input { width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem; border: 1px solid var(--c-border); background: var(--c-surface-2); color: var(--c-text); border-radius: 8px; font-size: 0.9rem; font-family: inherit; }
.eb-textarea { min-height: 90px; resize: vertical; }

.eb-checkrow { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.eb-check { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border: 1.5px solid var(--c-border); border-radius: 8px; cursor: pointer; font-size: 0.875rem; color: var(--c-text); }
.eb-check[data-on="true"] { border-color: var(--c-accent); background: var(--c-accent-soft); }
.eb-check input { accent-color: var(--c-accent); }

/* Toggle pill */
.eb-pill { position: relative; width: 40px; height: 22px; border-radius: 11px; border: 1px solid var(--c-border); background: var(--c-surface-2); cursor: pointer; flex-shrink: 0; padding: 0; }
.eb-pill[data-on="true"] { background: var(--c-accent); border-color: var(--c-accent); }
.eb-knob { position: absolute; top: 2px; left: 0; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: transform .2s; }

/* Color dot */
.eb-colordot { position: relative; width: 26px; height: 26px; border-radius: 7px; border: 1px solid var(--c-border); overflow: hidden; flex-shrink: 0; cursor: pointer; display: inline-block; }
.eb-colordot input { position: absolute; inset: -25%; width: 150%; height: 150%; opacity: 0; border: none; cursor: pointer; }

/* Cover blocks */
.eb-block { border: 1px solid var(--c-border); border-radius: 10px; padding: 0.625rem; background: var(--c-surface-2); display: flex; flex-direction: column; gap: 0.5rem; }
.eb-blockctl { display: flex; align-items: center; gap: 0.5rem; }
.eb-fontsel { flex: 1; min-width: 0; padding: 0.4rem 0.5rem; font-size: 0.8rem; }
.eb-range { flex: 1; accent-color: var(--c-accent); }
.eb-iconbtn { width: 30px; height: 30px; border: 1px solid var(--c-border); background: var(--c-surface); border-radius: 7px; cursor: pointer; color: var(--c-text); font-size: 0.85rem; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.eb-iconbtn:hover { background: var(--c-surface-2); }
.eb-danger { color: #dc2626; }
.eb-add { background: transparent; border: 1px dashed var(--c-border); border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.8rem; color: var(--c-muted); cursor: pointer; font-weight: 600; }
.eb-add:hover { border-color: var(--c-accent); color: var(--c-accent); }
.eb-addsection { padding: 0.7rem; }

/* Animation grid */
.eb-animgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.eb-animbox { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.75rem; border: 2px solid var(--c-border); border-radius: 10px; background: var(--c-surface-2); cursor: pointer; text-align: left; }
.eb-animbox[data-on="true"] { border-color: var(--c-accent); background: var(--c-accent-soft); }
.eb-animicon { font-size: 1.4rem; }
.eb-animlbl { font-size: 0.85rem; font-weight: 600; color: var(--c-text); }
.eb-animdesc { font-size: 0.7rem; color: var(--c-muted); }

/* Segmented */
.eb-seg { display: flex; gap: 0.25rem; background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: 9px; padding: 0.25rem; }
.eb-segsm { display: inline-flex; }
.eb-segbtn { flex: 1; border: none; background: transparent; color: var(--c-muted); padding: 0.4rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; font-family: inherit; }
.eb-segbtn[data-on="true"] { background: var(--c-accent); color: #fff; }

/* Section panels */
.eb-section { border: 1.5px solid var(--c-border); border-radius: 10px; overflow: hidden; background: var(--c-surface); }
.eb-section[data-open="true"] { border-color: var(--c-accent); }
.eb-sechead { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.75rem; background: var(--c-surface-2); }
.eb-grip { cursor: grab; color: var(--c-muted); }
.eb-secname { flex: 1; min-width: 0; border: none; background: transparent; color: var(--c-text); font-weight: 600; font-size: 0.9rem; font-family: inherit; padding: 0.2rem; }
.eb-secname:focus { outline: 1px solid var(--c-border); border-radius: 5px; }
.eb-secbody { padding: 0.75rem; border-top: 1px solid var(--c-border); display: flex; flex-direction: column; gap: 0.75rem; }
.eb-removelink { align-self: flex-start; background: none; border: none; color: #dc2626; font-size: 0.8rem; cursor: pointer; padding: 0; }

/* Agenda */
.eb-agenda { display: flex; flex-direction: column; gap: 0.4rem; border: 1px solid var(--c-border); border-radius: 9px; padding: 0.625rem; background: var(--c-surface-2); }
.eb-agendatop { display: flex; gap: 0.5rem; align-items: center; }
.eb-iconup { position: relative; width: 38px; height: 38px; border: 1px dashed var(--c-border); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: text; flex-shrink: 0; background: var(--c-surface); }
.eb-iconup[data-off="true"] { opacity: 0.4; }
.eb-iconup input { position: absolute; inset: 0; opacity: 0; cursor: text; }
.eb-minitoggle { display: flex; align-items: center; gap: 0.5rem; }

/* Upload */
.eb-upload { border: 1.5px dashed var(--c-border); border-radius: 10px; min-height: 96px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; background: var(--c-surface-2); }
.eb-upload:hover { border-color: var(--c-accent); }
.eb-uploadph { color: var(--c-muted); font-size: 0.85rem; font-weight: 600; }
.eb-uploadimg { width: 100%; height: 140px; object-fit: cover; display: block; }
.eb-iconbtn[data-on="true"] { border-color: var(--c-accent); color: var(--c-accent); background: var(--c-accent-soft); }
.eb-galgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 0.4rem; }
.eb-galcell { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: var(--c-surface-2); }
.eb-galcell img { width: 100%; height: 100%; object-fit: cover; }
.eb-galcell button { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff; cursor: pointer; font-size: 0.6rem; line-height: 1; }

/* Save bar */
.eb-savebar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.875rem 1rem; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 12px; position: sticky; bottom: 0; }
.eb-btn-primary { padding: 0.5rem 1.25rem; background: var(--c-accent); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
.eb-btn-ghost { padding: 0.5rem 1rem; background: var(--c-surface-2); color: var(--c-text); border: 1px solid var(--c-border); border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }

/* Preview column */
.eb-previewcol { display: flex; flex-direction: column; gap: 0.75rem; position: sticky; top: 3.5rem; }
@media (max-width: 920px) { .eb-previewcol { position: static; } }
.eb-pvtoolbar { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: center; }
.eb-chip { padding: 0.4rem 0.75rem; border: 1px solid var(--c-border); background: var(--c-surface); color: var(--c-text); border-radius: 999px; font-size: 0.78rem; font-weight: 600; cursor: pointer; }
.eb-chip[data-on="true"] { background: var(--c-accent); color: #fff; border-color: var(--c-accent); }

.eb-stage { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.eb-draghandle { font-size: 0.75rem; color: var(--c-muted); cursor: grab; user-select: none; display: flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.6rem; border: 1px solid var(--c-border); border-radius: 999px; background: var(--c-surface); touch-action: none; }
.eb-draghandle:active { cursor: grabbing; }
.eb-resetpos { background: none; border: none; color: var(--c-accent); cursor: pointer; font-size: 0.72rem; text-decoration: underline; }
.eb-framewrap { width: 100%; display: flex; justify-content: center; }

/* Device frame */
.eb-device { width: 375px; height: 812px; flex-shrink: 0; transform-origin: top center; background: #000; border-radius: 44px; padding: 8px; box-shadow: 0 24px 60px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.06) inset; position: relative; }
.eb-statusbar { position: absolute; top: 8px; left: 8px; right: 8px; height: 38px; display: flex; align-items: center; justify-content: space-between; padding: 0 1.4rem; color: #fff; font-size: 0.72rem; font-weight: 600; z-index: 3; pointer-events: none; }
.eb-notch { width: 120px; height: 26px; background: #000; border-radius: 0 0 16px 16px; }
.eb-screen { width: 100%; height: 100%; border-radius: 36px; overflow: hidden; position: relative; background: #11151c; }
.eb-screen > div { width: 100%; height: 100%; overflow-y: auto; }

/* Fullscreen modal */
.eb-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
.eb-overlay-inner { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; max-height: 100%; }

/* Hover guide — editor */
.eb-handgrid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 0.4rem; }
@media (max-width: 520px) { .eb-handgrid { grid-template-columns: repeat(4, 1fr); } }
.eb-handbtn { aspect-ratio: 1; border: 2px solid var(--c-border); border-radius: 9px; background: var(--c-surface-2); font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.eb-handbtn[data-on="true"] { border-color: var(--c-accent); background: var(--c-accent-soft); }
`;
