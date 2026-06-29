"use client";

/**
 * Shared invitation "canvas" — single source of truth for how a builder
 * invitation looks, used by BOTH the admin EventBuilder preview and the live
 * guest invite, so the preview always matches reality.
 */

import { useRef, useState, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

export type Mode = "photo" | "text";
export type AnimId = "fade" | "envelope" | "curtain" | "slideUp" | "zoomBlur" | "rise" | "flip" | "doors";
export type SectionAnim = "none" | "fade" | "slideUp" | "zoom";
export type HandAnim = "pulse" | "tap" | "drag";
export type Interaction = "click" | "drag";
export type BgKind = "color" | "photo" | "gif" | "video";

export interface Pos { xPct: number; yPct: number }

/** A single background layer — cover and content each have their own. */
export interface Background {
  kind: BgKind; imageUrl: string; videoUrl: string; color: string;
  blur: number; opacity: number; overlayColor: string;
  /** Video-only: autoplay, and lock all interaction until the clip ends. */
  autoplay: boolean; lockUntilEnd: boolean;
}

/** Cover text element — freely drag-positioned on the cover. */
export interface CoverBlock { id: string; text: string; textEn?: string; font: string; color: string; size: number; pos: Pos }
/** A text cell inside a content section (font + color per box). */
export interface SectionBlock { id: string; text: string; font: string; color: string; nowrap?: boolean }
/** Monogram / logo image shown on cover and/or content. */
export interface Monogram { url: string; scalePct: number; pos: Pos; showCover: boolean; showContent: boolean }
/** Guest-name placeholder shown on the cover (real name injected on the live invite). */
export interface GuestNamePreset { enabled: boolean; text: string; font: string; color: string; size: number; pos: Pos }
export interface AgendaItem { id: string; icon: string; showIcon: boolean; time: string; name: string }
export interface GuideBlock { id: string; text: string; font: string; color: string; xPct: number; yPct: number }
export interface GuideState {
  enabled: boolean; interaction: Interaction; blocks: GuideBlock[];
  hand: { value: string; isImage: boolean; xPct: number; yPct: number; anim: HandAnim };
}

export type SectionKind = "wording" | "agenda" | "memory" | "aba" | "map" | "wishing" | "rsvp" | "custom";

export interface Section {
  id: string; name: string; kind: SectionKind; visible: boolean; showTitle: boolean; mode: Mode;
  blocks: SectionBlock[];        // text-mode content (rows), flowed into `columns`
  blocksEn?: SectionBlock[];     // EN parallel — falls back to blocks when not set
  columns: 1 | 2 | 3;
  imageUrl: string; imageScalePct: number;   // photo mode + its scale
  imageUrlEn?: string;           // EN photo — falls back to imageUrl when not set
  agenda: AgendaItem[];
  gallery: string[];                          // memory
  aba: { qrUrl: string; name: string; note: string };
  map: { url: string; imageUrl: string };
  wishing: { placeholder: string };
  anim: SectionAnim;             // entrance animation when scrolled into view
}

export interface MusicState {
  url: string;
  playAfterVideoEnd: boolean;
  playOnLoad: boolean;
  playOnScroll: boolean;
}

export interface OverlayButtons {
  playPause: boolean;
  map: boolean;
  wishGift: boolean;
  scrollBack: boolean;
}

export interface BuilderState {
  eventName: string; eventType: string; dateTime: string; langs: { khmer: boolean; english: boolean };
  coverBlocks: CoverBlock[]; openBtnPos: Pos; anim: AnimId; keepCover: boolean;
  coverBg: Background; contentBg: Background;
  sections: Section[];
  coverGuide: GuideState; contentGuide: GuideState;
  monogram: Monogram;
  guestName: GuestNamePreset;
  music: MusicState;
  overlayButtons: OverlayButtons;
  outerBg: Background;
}

// ── Background layer ────────────────────────────────────────────────────────────

export function BackgroundLayer({ bg, onVideoEnded }: { bg: Background; onVideoEnded?: () => void }) {
  const blur = bg.blur ? `blur(${bg.blur}px)` : undefined;
  const isImg = (bg.kind === "photo" || bg.kind === "gif") && bg.imageUrl;
  const isVid = bg.kind === "video" && bg.videoUrl;
  const videoRef = useRef<HTMLVideoElement>(null);
  // When autoplay is off, the guest taps to start the video.
  const [needsPlay, setNeedsPlay] = useState(isVid && !bg.autoplay);
  useEffect(() => { setNeedsPlay(isVid && !bg.autoplay); }, [isVid, bg.autoplay, bg.videoUrl]);
  const play = () => { void videoRef.current?.play(); setNeedsPlay(false); };

  return (
    <div className="pv-bg" style={bg.kind === "color" ? { background: bg.color } : undefined}>
      {isImg && <img className="pv-bg-media" src={bg.imageUrl} alt="" style={{ filter: blur }} />}
      {isVid && <video ref={videoRef} className="pv-bg-media" src={bg.videoUrl} style={{ filter: blur }}
        autoPlay={bg.autoplay} loop={!bg.lockUntilEnd} muted playsInline onEnded={onVideoEnded} />}
      {bg.kind !== "color" && <div className="pv-bg-scrim" style={{ background: bg.overlayColor, opacity: bg.opacity }} />}
      {isVid && needsPlay && (
        <button type="button" className="pv-bg-play" onClick={play} aria-label="Tap to play"><span /></button>
      )}
    </div>
  );
}

/** Reveals children with an entrance animation when scrolled into view. */
function Reveal({ anim, children }: { anim: SectionAnim; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(anim === "none");
  useEffect(() => {
    if (anim === "none" || shown || !ref.current) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); o.disconnect(); } }, { threshold: 0.15 });
    o.observe(ref.current);
    return () => o.disconnect();
  }, [anim, shown]);
  return <div ref={ref} className={anim === "none" ? undefined : shown ? `anim-sec-${anim}` : "anim-sec-pre"}>{children}</div>;
}

// ── Setup snapshot ──────────────────────────────────────────────────────────────

export function PvSetup({ st }: { st: BuilderState }) {
  const date = st.dateTime ? new Date(st.dateTime) : null;
  return (
    <div className="pv-setup">
      <BackgroundLayer bg={st.coverBg} />
      <div className="pv-setup-card">
        <div className="pv-kicker">{st.eventType}</div>
        <div className="pv-title">{st.eventName || "Your event"}</div>
        {date && <div className="pv-sub">{date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>}
        {date && <div className="pv-sub">{date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>}
        <div className="pv-langs">
          {st.langs.khmer && <span className="pv-lang">ខ្មែរ</span>}
          {st.langs.english && <span className="pv-lang">EN</span>}
        </div>
      </div>
    </div>
  );
}

// ── Cover — freely drag-positioned elements over a background ─────────────────────

export type CoverMoveKind = "block" | "open" | "mono" | "guest";

function pvHex(c: string): string {
  if (!c) return "#ffffff";
  if (/^#[0-9a-f]{3,8}$/i.test(c.trim())) return c.trim().slice(0, 7);
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) { const h = (n: string) => (+n).toString(16).padStart(2, "0"); return `#${h(m[1])}${h(m[2])}${h(m[3])}`; }
  return "#ffffff";
}

function BlockTextEdit({ text, onChange, onClose }: {
  text: string; onChange: (t: string) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = text;
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    if (sel) { range.selectNodeContents(el); range.collapse(false); sel.removeAllRanges(); sel.addRange(range); }
  // only run on mount — don't reset content on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <span ref={ref} contentEditable suppressContentEditableWarning className="pv-blockedit"
      onInput={() => onChange(ref.current?.textContent ?? "")}
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } e.stopPropagation(); }} />
  );
}

function TransformHandles({
  coverRef, blockEl, centerXPct, centerYPct,
  onHandleDown,
}: {
  coverRef: React.RefObject<HTMLDivElement>;
  blockEl: HTMLElement | null;
  centerXPct: number; centerYPct: number;
  onHandleDown: (e: React.PointerEvent) => void;
}) {
  const [box, setBox] = useState<{ l: number; t: number; w: number; h: number } | null>(null);
  useEffect(() => {
    if (!blockEl || !coverRef.current) { setBox(null); return; }
    const measure = () => {
      if (!coverRef.current) return;
      const cr = coverRef.current.getBoundingClientRect();
      const ir = blockEl.getBoundingClientRect();
      setBox({
        l: (ir.left - cr.left) / cr.width * 100,
        t: (ir.top - cr.top) / cr.height * 100,
        w: ir.width / cr.width * 100,
        h: ir.height / cr.height * 100,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(blockEl);
    return () => ro.disconnect();
  }, [blockEl, coverRef]);
  if (!box) return null;
  const { l, t, w, h } = box;
  const corners = [
    { x: l,     y: t,     cur: "nw-resize" },
    { x: l + w, y: t,     cur: "ne-resize" },
    { x: l + w, y: t + h, cur: "se-resize" },
    { x: l,     y: t + h, cur: "sw-resize" },
  ];
  const handleDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!coverRef.current) return;
    const cr = coverRef.current.getBoundingClientRect();
    const cx = cr.left + cr.width * (centerXPct / 100);
    const cy = cr.top + cr.height * (centerYPct / 100);
    // record center on the pointer event so caller can compute startDist
    (e as unknown as { _cx: number; _cy: number })._cx = cx;
    (e as unknown as { _cx: number; _cy: number })._cy = cy;
    onHandleDown(e);
    coverRef.current.setPointerCapture(e.pointerId);
  };
  return (
    <>
      <div className="pv-transform-box" style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }} />
      {corners.map((c, i) => (
        <div key={i} className="pv-transform-handle" style={{ left: `${c.x}%`, top: `${c.y}%`, cursor: c.cur }}
          onPointerDown={handleDown} />
      ))}
    </>
  );
}

export function PvCover({ st, editable = false, onMoveCover, onEditCoverBlock, fontOptions, onResizeMono, onOpen, animKey, locked, onVideoEnded, guestNameValue, lang = "kh" }: {
  st: BuilderState; editable?: boolean;
  onMoveCover?: (kind: CoverMoveKind, id: string | undefined, xPct: number, yPct: number) => void;
  onEditCoverBlock?: (id: string, p: Partial<CoverBlock>) => void;
  fontOptions?: { label: string; stack: string }[];
  onResizeMono?: (scalePct: number) => void;
  onOpen?: () => void; animKey?: number; locked?: boolean; onVideoEnded?: () => void; guestNameValue?: string;
  lang?: "kh" | "en";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const blockEls = useRef<Map<string, HTMLDivElement>>(new Map());
  // Extended internal drag state — includes resize kinds not exported on CoverMoveKind
  type DragState = { kind: CoverMoveKind | "block-resize" | "mono-resize"; id?: string; startSize?: number; startDist?: number; startCx?: number; startCy?: number };
  const drag = useRef<DragState | null>(null);
  const moved = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null); // block id or "mono"
  const mono = st.monogram;
  const gn = st.guestName;

  const move = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const d = drag.current;

    if (d.kind === "block-resize" || d.kind === "mono-resize") {
      if ((d.startDist ?? 0) < 2) { moved.current = true; return; }
      const dist = Math.sqrt((e.clientX - (d.startCx ?? 0)) ** 2 + (e.clientY - (d.startCy ?? 0)) ** 2);
      const ratio = dist / d.startDist!;
      if (d.kind === "block-resize") {
        const sz = Math.max(10, Math.min(100, Math.round((d.startSize ?? 16) * ratio)));
        onEditCoverBlock?.(d.id!, { size: sz });
      } else {
        const sc = Math.max(5, Math.min(90, Math.round((d.startSize ?? 22) * ratio)));
        onResizeMono?.(sc);
      }
      moved.current = true;
      return;
    }

    if (!onMoveCover) return;
    if (!moved.current && startPos.current) {
      if (Math.abs(e.clientX - startPos.current.x) < 5 && Math.abs(e.clientY - startPos.current.y) < 5) return;
      moved.current = true;
    }
    if (!moved.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    onMoveCover(d.kind as CoverMoveKind, d.id, x, y);
  };
  const start = (kind: CoverMoveKind, id?: string) => (e: React.PointerEvent) => {
    if (!editable) return;
    drag.current = { kind, id };
    moved.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const end = () => {
    const d = drag.current;
    const wasDrag = moved.current;
    drag.current = null;
    if (!editable) return;
    if (d?.kind === "block-resize" || d?.kind === "mono-resize") return; // stay active after resize
    if (!wasDrag && d?.kind === "block" && d.id) {
      setActiveId((prev) => (prev === d.id ? null : d.id!));
    } else if (!wasDrag && d?.kind === "mono") {
      setActiveId((prev) => (prev === "mono" ? null : "mono"));
    } else {
      setActiveId(null);
    }
  };

  // Called by TransformHandles corner onPointerDown — center coords are injected
  const startResize = (id: string | "mono", currentSize: number) => (e: React.PointerEvent) => {
    const ex = (e as unknown as { _cx?: number })._cx;
    const ey = (e as unknown as { _cy?: number })._cy;
    const cx = ex ?? e.clientX;
    const cy = ey ?? e.clientY;
    const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
    drag.current = {
      kind: id === "mono" ? "mono-resize" : "block-resize",
      id,
      startSize: currentSize,
      startDist: Math.max(dist, 10), // minimum threshold
      startCx: cx, startCy: cy,
    };
    moved.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <div ref={ref} className="pv-cover" onPointerMove={move} onPointerUp={end}>
      <BackgroundLayer bg={st.coverBg} onVideoEnded={onVideoEnded} />
      <div className={`pv-cover-stage anim-${st.anim}`} key={animKey}>
        {mono.showCover && mono.url && (
          <img className="pv-mono" data-edit={editable}
            data-active={editable && activeId === "mono"}
            src={mono.url} alt="" draggable={false}
            style={{ left: `${mono.pos.xPct}%`, top: `${mono.pos.yPct}%`, width: `${mono.scalePct}%` }}
            onPointerDown={start("mono")} />
        )}
        {mono.showCover && mono.url && editable && activeId === "mono" && (
          <TransformHandles
            coverRef={ref}
            blockEl={ref.current?.querySelector<HTMLElement>(".pv-mono[data-active='true']") ?? null}
            centerXPct={mono.pos.xPct}
            centerYPct={mono.pos.yPct}
            onHandleDown={startResize("mono", mono.scalePct)}
          />
        )}
        {st.coverBlocks.map((b) => {
          const displayText = (lang === "en" && b.textEn) ? b.textEn : b.text;
          const isActive = editable && activeId === b.id && !!onEditCoverBlock;
          return (
            <div key={b.id}
              ref={(el) => { if (el) blockEls.current.set(b.id, el); else blockEls.current.delete(b.id); }}
              className={`pv-coverblock${isActive ? " pv-coverblock-active" : ""}`}
              data-edit={editable}
              style={{ left: `${b.pos.xPct}%`, top: `${b.pos.yPct}%`, fontFamily: b.font, color: b.color, fontSize: b.size }}
              onPointerDown={start("block", b.id)}>
              {isActive
                ? <BlockTextEdit
                    text={lang === "en" ? (b.textEn ?? b.text) : b.text}
                    onChange={(t) => onEditCoverBlock!(b.id, lang === "en" ? { textEn: t } : { text: t })}
                    onClose={() => setActiveId(null)} />
                : displayText}
              {isActive && (
                <div className="pv-blocktoolbar" onPointerDown={(e) => e.stopPropagation()}
                  style={{ [b.pos.yPct < 55 ? "top" : "bottom"]: "calc(100% + 8px)" }}>
                  {fontOptions && fontOptions.length > 0 && (
                    <select className="pv-tsel" value={b.font}
                      onChange={(e) => onEditCoverBlock!(b.id, { font: e.target.value })}>
                      {fontOptions.map((f) => <option key={f.label} value={f.stack}>{f.label}</option>)}
                    </select>
                  )}
                  <input type="number" className="pv-tnum" min={10} max={100} value={b.size}
                    onChange={(e) => onEditCoverBlock!(b.id, { size: +e.target.value })} />
                  <span className="pv-tclrdot" style={{ background: b.color }}>
                    <input type="color" value={pvHex(b.color)}
                      onChange={(e) => onEditCoverBlock!(b.id, { color: e.target.value })} />
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {/* Transform handles for active block (rendered outside block div so they're in pv-cover-stage) */}
        {editable && activeId && activeId !== "mono" && !!onEditCoverBlock && (() => {
          const b = st.coverBlocks.find(bl => bl.id === activeId);
          if (!b) return null;
          return (
            <TransformHandles
              coverRef={ref}
              blockEl={blockEls.current.get(activeId) ?? null}
              centerXPct={b.pos.xPct}
              centerYPct={b.pos.yPct}
              onHandleDown={startResize(b.id, b.size)}
            />
          );
        })()}
        {gn.enabled && (
          <div className="pv-guestname" data-edit={editable}
            style={{ left: `${gn.pos.xPct}%`, top: `${gn.pos.yPct}%`, fontFamily: gn.font, color: gn.color, fontSize: gn.size }}
            onPointerDown={start("guest")}>
            {guestNameValue || gn.text}
          </div>
        )}
        {onOpen && (
          <button type="button" className="pv-openbtn" data-edit={editable} disabled={!editable && locked}
            style={{ left: `${st.openBtnPos.xPct}%`, top: `${st.openBtnPos.yPct}%`, opacity: !editable && locked ? 0.5 : 1 }}
            onPointerDown={start("open")}
            onClick={() => { if (!editable && !locked) onOpen?.(); }}>
            {!editable && locked ? "Please wait…" : "Open Ticket"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Content body ────────────────────────────────────────────────────────────────

export function PvContent({ st, editable = false, onEditBlock, onReorder, lang = "kh" }: {
  st: BuilderState; editable?: boolean;
  onEditBlock?: (secId: string, blockId: string, text: string) => void;
  onReorder?: (from: number, to: number) => void;
  lang?: "kh" | "en";
}) {
  const dragFrom = useRef<number | null>(null);
  const visible = st.sections.map((s, i) => ({ s, i })).filter(({ s }) => s.visible);
  const mono = st.monogram;
  return (
    <div className="pv-content">
      <BackgroundLayer bg={st.contentBg} />
      <div className="pv-content-inner">
        {visible.map(({ s, i }) => (
          <Reveal key={s.id} anim={editable ? "none" : s.anim}>
          <div className="pv-sec"
            draggable={editable && !!onReorder}
            onDragStart={editable && onReorder ? () => (dragFrom.current = i) : undefined}
            onDragOver={editable && onReorder ? (e) => e.preventDefault() : undefined}
            onDrop={editable && onReorder ? () => { if (dragFrom.current !== null && dragFrom.current !== i) onReorder(dragFrom.current, i); dragFrom.current = null; } : undefined}
            data-edit={editable}>
            {/* Monogram appears only on Formal Wording sections */}
            {s.kind === "wording" && mono.showContent && mono.url && (
              <img className="pv-mono-content" src={mono.url} alt="" style={{ width: `${mono.scalePct}%` }} />
            )}
            {s.showTitle && <div className="pv-secname">{s.name}</div>}
            <SectionBody s={s} editable={editable} onEditBlock={onEditBlock} lang={lang} />
          </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function SectionBody({ s, editable, onEditBlock, lang = "kh" }: {
  s: Section; editable: boolean; onEditBlock?: (secId: string, blockId: string, text: string) => void; lang?: "kh" | "en";
}) {
  const scalePct = Number.isFinite(s.imageScalePct) ? Math.min(100, Math.max(10, s.imageScalePct)) : 100;
  const scaled = (url: string) => <img src={url} alt="" className="pv-secimg" style={{ width: `${scalePct}%`, maxWidth: "100%", margin: "0 auto" }} />;

  // Photo mode — use EN image if set and lang=en, else KH/default image
  if (s.mode === "photo") {
    const url = (lang === "en" && s.imageUrlEn) ? s.imageUrlEn : s.imageUrl;
    return url ? scaled(url) : <div className="pv-secph">Image</div>;
  }

  switch (s.kind) {
    case "agenda":
      return (
        <div className="pv-agenda">
          {s.agenda.map((a) => (
            <div key={a.id} className="pv-agendarow">
              {a.showIcon && <span className="pv-agendaicon">{a.icon}</span>}
              <span className="pv-agendatime">{a.time}</span>
              <span className="pv-agendaname">{a.name}</span>
            </div>
          ))}
        </div>
      );
    case "memory":
      return s.gallery.length ? (
        <div className="pv-gallery" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${scalePct}%, 1fr))` }}>
          {s.gallery.map((url, gi) => <img key={gi} src={url} alt="" className="pv-galimg" />)}
        </div>
      ) : <div className="pv-secph">Gallery photos</div>;
    case "aba":
      return (
        <div className="pv-aba">
          {s.aba.qrUrl ? <img src={s.aba.qrUrl} alt="" className="pv-qr" style={{ width: `${scalePct}%` }} /> : <div className="pv-secph">QR code</div>}
          {s.aba.name && <div className="pv-aba-name">{s.aba.name}</div>}
          {s.aba.note && <div className="pv-aba-note">{s.aba.note}</div>}
        </div>
      );
    case "map":
      return (
        <div className="pv-map">
          {s.map.imageUrl ? <img src={s.map.imageUrl} alt="" className="pv-secimg" /> : <div className="pv-secph">Map</div>}
          {s.map.url && <a href={s.map.url} target="_blank" rel="noreferrer" className="pv-inlinebtn">Open in Maps</a>}
        </div>
      );
    case "wishing":
      return (
        <div className="pv-wishing">
          <div className="pv-wish-input">{s.wishing.placeholder || "Leave a wish…"}</div>
          <div className="pv-inlinebtn">Send wish</div>
        </div>
      );
    case "rsvp":
      return <div className="pv-rsvp"><div className="pv-inlinebtn pv-rsvp-btn">RSVP</div></div>;
    default: {
      const activeBlocks = (lang === "en" && s.blocksEn && s.blocksEn.length) ? s.blocksEn : s.blocks;
      return (
        <div className="pv-sectext" style={{ columnCount: s.columns }}>
          {activeBlocks.map((bl) => (
            <div key={bl.id} className="pv-textblock" style={{ fontFamily: bl.font, color: bl.color, whiteSpace: bl.nowrap ? "pre" : "pre-line" }}
              contentEditable={editable && lang !== "en"} suppressContentEditableWarning
              onBlur={editable && lang !== "en" && onEditBlock ? (e) => onEditBlock(s.id, bl.id, e.currentTarget.textContent ?? "") : undefined}>
              {bl.text}
            </div>
          ))}
        </div>
      );
    }
  }
}

// ── Language switcher (live invite) ─────────────────────────────────────────────

export function LangSwitcher({ lang, onChange }: { lang: "kh" | "en"; onChange: (l: "kh" | "en") => void }) {
  return (
    <div className="pv-langsw">
      <button type="button" className="pv-langsw-btn" data-on={lang === "kh"} onClick={() => onChange("kh")}>ខ្មែរ</button>
      <button type="button" className="pv-langsw-btn" data-on={lang === "en"} onClick={() => onChange("en")}>EN</button>
    </div>
  );
}

// ── Floating overlay buttons (live invite + admin preview) ──────────────────────

export function FloatingOverlayButtons({ ob, onPlayPause, isPlaying, onScrollBack, onMap, onWish, preview = false }: {
  ob: OverlayButtons;
  onPlayPause?: () => void; isPlaying?: boolean;
  onScrollBack?: () => void; onMap?: () => void; onWish?: () => void;
  preview?: boolean;
}) {
  const visible = ob.playPause || ob.map || ob.wishGift || ob.scrollBack;
  if (!visible) return null;
  return (
    <div className={`pv-floatbtns${preview ? " pv-floatbtns-preview" : ""}`}>
      {ob.playPause && (
        <button type="button" className="pv-floatbtn" onClick={onPlayPause} title={isPlaying ? "Pause" : "Play music"}>
          {isPlaying ? "⏸" : "▶"}
        </button>
      )}
      {ob.map && (
        <button type="button" className="pv-floatbtn" onClick={onMap} title="Map">🗺</button>
      )}
      {ob.wishGift && (
        <button type="button" className="pv-floatbtn" onClick={onWish} title="Wish & Gift">🎁</button>
      )}
      {ob.scrollBack && (
        <button type="button" className="pv-floatbtn" onClick={onScrollBack} title="Scroll back">↑</button>
      )}
    </div>
  );
}

// ── Hover guide overlay (one instance per context: cover or content) ─────────────

export function GuideOverlay({ guide, editable = false, onMove, onDismiss }: {
  guide: GuideState; editable?: boolean;
  onMove?: (kind: "hand" | "block", id: string | undefined, xPct: number, yPct: number) => void;
  onDismiss?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: "hand" | "block"; id?: string } | null>(null);

  const handleMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current || !onMove) return;
    const r = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    onMove(drag.current.kind, drag.current.id, x, y);
  };
  const start = (kind: "hand" | "block", id?: string) => (e: React.PointerEvent) => {
    if (!editable) return;
    drag.current = { kind, id };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const end = () => { drag.current = null; };

  return (
    <div ref={ref} className="pv-guide" data-edit={editable} data-live={!editable && !!onDismiss}
      onPointerMove={handleMove} onPointerUp={end}
      onPointerDown={!editable && onDismiss ? () => onDismiss() : undefined}>
      <div className="pv-guide-scrim" />
      {guide.blocks.map((b) => (
        <div key={b.id} className="pv-guideblock" data-edit={editable}
          style={{ left: `${b.xPct}%`, top: `${b.yPct}%`, fontFamily: b.font, color: b.color }}
          onPointerDown={start("block", b.id)}>
          {b.text}
        </div>
      ))}
      <div className={`pv-guidehand anim-hand-${guide.hand.anim}`} data-edit={editable}
        style={{ left: `${guide.hand.xPct}%`, top: `${guide.hand.yPct}%` }}
        onPointerDown={start("hand")}>
        {guide.hand.isImage ? <img src={guide.hand.value} alt="" /> : <span>{guide.hand.value}</span>}
      </div>
    </div>
  );
}

// ── Shared canvas CSS (identical in preview and live invite) ─────────────────────

export const canvasStyles = `
.pv-setup { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 2rem 1.5rem; min-height: 100%; }
.pv-setup-card { position: relative; z-index: 2; text-align: center; color: #fff; display: flex; flex-direction: column; gap: 0.5rem; }
.pv-kicker { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.7rem; opacity: 0.7; }
.pv-title { font-size: 1.7rem; font-weight: 700; font-family: Georgia, serif; }
.pv-sub { font-size: 0.9rem; opacity: 0.85; }
.pv-langs { display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.75rem; }
.pv-lang { border: 1px solid rgba(255,255,255,0.4); border-radius: 999px; padding: 0.2rem 0.7rem; font-size: 0.75rem; }

.pv-bg { position: absolute; inset: 0; overflow: hidden; }
.pv-bg-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pv-bg-scrim { position: absolute; inset: 0; }
/* Animated "tap to play" cue (pulsing rings) — no static play icon */
.pv-bg-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 5; width: 58px; height: 58px; border-radius: 50%; border: none; background: rgba(255,255,255,0.16); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
.pv-bg-play span { width: 13px; height: 13px; border-radius: 50%; background: rgba(255,255,255,0.95); box-shadow: 0 0 8px rgba(255,255,255,0.6); }
.pv-bg-play::before, .pv-bg-play::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(255,255,255,0.85); animation: ebTapPulse 1.7s ease-out infinite; }
.pv-bg-play::after { animation-delay: 0.85s; }
@keyframes ebTapPulse { 0% { transform: scale(0.7); opacity: 0.9; } 100% { transform: scale(2.4); opacity: 0; } }

/* Cover — drag-positioned elements over a fixed background */
.pv-cover { position: relative; min-height: 100%; overflow: hidden; color: #fff; }
.pv-cover-stage { position: absolute; inset: 0; z-index: 2; }
.pv-coverblock { position: absolute; transform: translate(-50%, -50%); max-width: 88%; text-align: center; line-height: 1.25; white-space: pre-wrap; pointer-events: none; }
.pv-coverblock[data-edit="true"] { pointer-events: auto; cursor: grab; outline: 1px dashed rgba(255,255,255,0.5); outline-offset: 3px; border-radius: 4px; }
.pv-openbtn { position: absolute; transform: translate(-50%, -50%); padding: 0.6rem 1.5rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.6); background: rgba(255,255,255,0.12); color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer; backdrop-filter: blur(4px); white-space: nowrap; }
.pv-openbtn[data-edit="true"] { cursor: grab; }

/* Content */
/* Grid overlay so the single shared background stretches over ALL sections
   (covers the full scroll height, not just the first screenful). */
.pv-content { position: relative; min-height: 100%; overflow: hidden; color: #fff; display: grid; grid-template-columns: 1fr; }
.pv-content > .pv-bg { position: relative; grid-area: 1 / 1; align-self: stretch; }
.pv-content-inner { position: relative; z-index: 2; grid-area: 1 / 1; display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem 1.25rem; }
.pv-sec[data-edit="true"] { outline: 1px dashed rgba(255,255,255,0.4); outline-offset: 4px; border-radius: 6px; }
.pv-secname { text-align: center; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.8; margin-bottom: 0.6rem; }
.pv-sectext { text-align: center; }
.pv-textblock { white-space: pre-line; font-size: 0.95rem; line-height: 1.7; font-style: italic; outline: none; break-inside: avoid; margin-bottom: 0.5rem; }
.pv-textblock[contenteditable="true"]:focus { outline: 1px dashed rgba(255,255,255,0.5); border-radius: 4px; }
.pv-secimg { width: 100%; border-radius: 10px; display: block; }
.pv-secph { height: 120px; border-radius: 10px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.6); font-size: 0.85rem; }
.pv-agenda { display: flex; flex-direction: column; gap: 0.75rem; }
.pv-agendarow { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.85rem; background: rgba(255,255,255,0.08); border-radius: 10px; }
.pv-agendaicon { font-size: 1.2rem; }
.pv-agendatime { font-weight: 700; font-size: 0.85rem; min-width: 70px; }
.pv-agendaname { font-size: 0.9rem; opacity: 0.9; }
.pv-gallery { display: grid; gap: 0.5rem; }
.pv-galimg { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; display: block; }
.pv-aba { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.pv-qr { max-width: 100%; border-radius: 10px; background: #fff; padding: 6px; box-sizing: border-box; }
.pv-aba-name { font-weight: 700; }
.pv-aba-note { font-size: 0.85rem; opacity: 0.85; text-align: center; }
.pv-map { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
.pv-wishing { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
.pv-wish-input { width: 100%; min-height: 56px; box-sizing: border-box; border-radius: 10px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.06); padding: 0.6rem 0.8rem; font-size: 0.85rem; opacity: 0.7; }
.pv-rsvp { display: flex; justify-content: center; }
.pv-rsvp-btn { padding: 0.65rem 2rem; }
.pv-inlinebtn { display: inline-block; padding: 0.5rem 1.2rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.55); background: rgba(255,255,255,0.12); color: #fff; font-size: 0.82rem; font-weight: 600; cursor: pointer; text-decoration: none; }

.anim-fade { animation: ebFade .8s ease both; }
.anim-slideUp { animation: ebSlideUp .7s cubic-bezier(.2,.7,.2,1) both; }
.anim-envelope { animation: ebEnvelope .8s ease both; transform-origin: top center; }
.anim-curtain { animation: ebCurtain .8s ease both; }
@keyframes ebFade { from { opacity: 0; transform: scale(1.08); } to { opacity: 1; transform: scale(1); } }
@keyframes ebSlideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
@keyframes ebEnvelope { from { opacity: 0; transform: perspective(600px) rotateX(-80deg); } to { opacity: 1; transform: none; } }
@keyframes ebCurtain { from { opacity: 0; letter-spacing: 0.5em; } to { opacity: 1; letter-spacing: normal; } }
.anim-zoomBlur { animation: ebZoomBlur .9s ease both; }
.anim-rise { animation: ebRise .8s cubic-bezier(.2,.8,.2,1) both; }
.anim-flip { animation: ebFlip .9s ease both; transform-origin: center; }
.anim-doors { animation: ebDoors .9s ease both; }
@keyframes ebZoomBlur { from { opacity: 0; transform: scale(1.3); filter: blur(12px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ebRise { from { opacity: 0; transform: translateY(80px); } to { opacity: 1; transform: none; } }
@keyframes ebFlip { from { opacity: 0; transform: perspective(800px) rotateY(90deg); } to { opacity: 1; transform: none; } }
@keyframes ebDoors { from { opacity: 0; clip-path: inset(0 50% 0 50%); } to { opacity: 1; clip-path: inset(0 0 0 0); } }

/* Monogram / logo + guest name */
.pv-mono { position: absolute; transform: translate(-50%, -50%); object-fit: contain; pointer-events: none; }
.pv-mono[data-edit="true"] { pointer-events: auto; cursor: grab; outline: 1px dashed rgba(255,255,255,0.5); outline-offset: 3px; border-radius: 6px; }
.pv-mono-content { display: block; margin: 0 auto 1.25rem; object-fit: contain; }
.pv-guestname { position: absolute; transform: translate(-50%, -50%); text-align: center; white-space: nowrap; pointer-events: none; }
.pv-guestname[data-edit="true"] { pointer-events: auto; cursor: grab; outline: 1px dashed rgba(255,255,255,0.5); outline-offset: 3px; border-radius: 4px; }
.pv-openbtn:disabled { cursor: default; }

/* Per-section entrance animations (revealed on scroll) */
.anim-sec-pre { opacity: 0; }
.anim-sec-fade { animation: secFade .7s ease both; }
.anim-sec-slideUp { animation: secSlideUp .7s cubic-bezier(.2,.8,.2,1) both; }
.anim-sec-zoom { animation: secZoom .7s ease both; }
@keyframes secFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes secSlideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
@keyframes secZoom { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }

/* Click-to-edit block (active state + toolbar) */
.pv-coverblock-active { outline: 1.5px solid rgba(255,255,255,0.9) !important; border-radius: 4px; }
.pv-blockedit { display: block; outline: none; min-width: 40px; text-align: center; white-space: pre-wrap; background: transparent; border: none; color: inherit; font: inherit; cursor: text; }
.pv-blocktoolbar { position: absolute; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; background: rgba(8,8,14,0.9); border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; padding: 4px 6px; white-space: nowrap; z-index: 20; backdrop-filter: blur(10px); pointer-events: auto; }
.pv-tsel { font-size: 0.68rem; background: rgba(255,255,255,0.1); color: #fff; border: none; border-radius: 5px; padding: 2px 4px; max-width: 88px; outline: none; cursor: pointer; }
.pv-tnum { width: 36px; font-size: 0.68rem; background: rgba(255,255,255,0.1); color: #fff; border: none; border-radius: 5px; padding: 2px 4px; text-align: center; outline: none; }
.pv-tclrdot { position: relative; width: 18px; height: 18px; border-radius: 4px; overflow: hidden; display: inline-block; cursor: pointer; border: 1px solid rgba(255,255,255,0.3); flex-shrink: 0; }
.pv-tclrdot input[type="color"] { position: absolute; inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px); opacity: 0; cursor: pointer; }

/* Floating overlay buttons (live invite) */
.pv-floatbtns { position: fixed; bottom: 1.5rem; right: 1rem; display: flex; flex-direction: column; gap: 0.5rem; z-index: 50; }
.pv-floatbtns-preview { position: absolute; bottom: 1rem; right: 0.5rem; }
.pv-floatbtn { width: 38px; height: 38px; border-radius: 50%; border: none; background: rgba(15,15,25,0.78); color: #fff; font-size: 1rem; cursor: pointer; backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }

/* Transform handles (scale / resize) */
.pv-transform-box { position: absolute; pointer-events: none; border: 1.5px dashed rgba(255,255,255,0.7); box-sizing: border-box; z-index: 15; border-radius: 2px; }
.pv-transform-handle { position: absolute; width: 10px; height: 10px; background: #fff; border: 1.5px solid rgba(0,0,0,0.4); border-radius: 2px; transform: translate(-50%, -50%); z-index: 16; box-shadow: 0 1px 4px rgba(0,0,0,0.5); }
.pv-transform-handle:hover { background: #a0cfff; }

/* Language switcher pill (live invite) */
.pv-langsw { position: fixed; top: 0.75rem; right: 0.75rem; display: flex; z-index: 60; gap: 2px; background: rgba(10,10,20,0.6); border-radius: 999px; padding: 3px; backdrop-filter: blur(8px); }
.pv-langsw-btn { padding: 0.25rem 0.65rem; border-radius: 999px; border: none; background: transparent; color: rgba(255,255,255,0.6); font-size: 0.75rem; font-weight: 700; cursor: pointer; letter-spacing: 0.04em; }
.pv-langsw-btn[data-on="true"] { background: rgba(255,255,255,0.18); color: #fff; }

/* Hover guide */
.pv-guide { position: absolute; inset: 0; z-index: 6; pointer-events: none; }
.pv-guide[data-live="true"] { pointer-events: auto; cursor: pointer; }
.pv-guide-scrim { position: absolute; inset: 0; background: radial-gradient(circle at 50% 45%, rgba(0,0,0,0.15), rgba(0,0,0,0.55)); }
.pv-guideblock { position: absolute; transform: translate(-50%, -50%); font-size: 1rem; font-weight: 600; text-align: center; text-shadow: 0 1px 6px rgba(0,0,0,0.6); white-space: nowrap; padding: 0.3rem 0.6rem; }
.pv-guideblock[data-edit="true"] { pointer-events: auto; cursor: grab; outline: 1px dashed rgba(255,255,255,0.5); border-radius: 6px; }
.pv-guidehand { position: absolute; transform: translate(-50%, -50%); font-size: 2.4rem; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5)); }
.pv-guidehand[data-edit="true"] { pointer-events: auto; cursor: grab; }
.pv-guidehand img { width: 48px; height: 48px; object-fit: contain; display: block; }
.anim-hand-pulse { animation: ebHandPulse 1.3s ease-in-out infinite; }
.anim-hand-tap   { animation: ebHandTap 1.1s ease-in-out infinite; }
.anim-hand-drag  { animation: ebHandDrag 1.6s ease-in-out infinite; }
@keyframes ebHandPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.18); } }
@keyframes ebHandTap   { 0%,100% { transform: translate(-50%,-50%) translateY(0); } 45% { transform: translate(-50%,-50%) translateY(8px) scale(0.92); } }
@keyframes ebHandDrag  { 0%,100% { transform: translate(-50%,-50%) translateX(-14px); } 50% { transform: translate(-50%,-50%) translateX(14px); } }
`;
