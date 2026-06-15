"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BuilderSection, BuilderPkg } from "./BuilderClient";

interface Props {
  invitationId: string;
  sections: BuilderSection[];
  pkg: BuilderPkg | null;
}

interface SectionTypeDef {
  type: string;
  label: string;
  emoji: string;
  requires?: keyof BuilderPkg;
  defaultContent: Record<string, unknown>;
}

const SECTION_TYPES: SectionTypeDef[] = [
  { type: "cover", label: "Cover", emoji: "🖼", defaultContent: { heading: "", subheading: "" } },
  { type: "countdown", label: "Countdown", emoji: "⏱", defaultContent: { targetDate: "", label: "Days to go" } },
  { type: "details", label: "Details", emoji: "📋", defaultContent: { items: [{ icon: "📅", label: "Date", value: "" }] } },
  { type: "agenda", label: "Agenda", emoji: "🗓", defaultContent: { title: "Order of Ceremony", subtitle: "Agenda", items: [{ time: "", title: "", icon: 1 }] } },
  { type: "gallery", label: "Gallery", emoji: "🖼", defaultContent: { layout: "grid" } },
  { type: "video", label: "Video", emoji: "🎬", requires: "hasVideo", defaultContent: { url: "", caption: "" } },
  { type: "wishing", label: "Wishing Wall", emoji: "💌", requires: "hasWishing", defaultContent: { placeholder: "Leave your wishes here…" } },
  { type: "khqr", label: "KHQR", emoji: "📱", requires: "hasKhqr", defaultContent: { recipientName: "", amount: "", currency: "USD", qrImageUrl: "" } },
];

export function SectionsTab({ invitationId, sections, pkg }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  const availableTypes = SECTION_TYPES.filter(
    (t) => !t.requires || pkg?.[t.requires]
  );

  async function addSection(def: SectionTypeDef) {
    setLoading(true);
    const res = await fetch(`/api/dashboard/invitation/${invitationId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: def.type, content: def.defaultContent }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      alert(d.error ?? "Failed to add section");
      return;
    }
    router.refresh();
  }

  async function saveSection(sectionId: string) {
    setLoading(true);
    await fetch(`/api/dashboard/invitation/${invitationId}/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setLoading(false);
    setEditingId(null);
    router.refresh();
  }

  async function deleteSection(sectionId: string) {
    if (!confirm("Delete this section?")) return;
    setLoading(true);
    await fetch(`/api/dashboard/invitation/${invitationId}/sections/${sectionId}`, { method: "DELETE" });
    setLoading(false);
    if (editingId === sectionId) setEditingId(null);
    router.refresh();
  }

  async function moveSection(sectionId: string, direction: "up" | "down") {
    setLoading(true);
    await fetch(`/api/dashboard/invitation/${invitationId}/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    setLoading(false);
    router.refresh();
  }

  const maxReached = pkg ? sections.length >= pkg.maxSections : false;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.heading}>Sections</h2>
        <span style={s.count}>{sections.length} / {pkg?.maxSections ?? "∞"}</span>
      </div>

      {sections.length === 0 ? (
        <div style={s.empty}>No sections yet. Add one below.</div>
      ) : (
        <div style={s.list}>
          {sections.map((sec, idx) => {
            const def = SECTION_TYPES.find((d) => d.type === sec.type);
            const isEditing = editingId === sec.id;
            return (
              <div key={sec.id} style={s.sectionRow}>
                <div style={s.sectionTop}>
                  <div style={s.sectionInfo}>
                    <span style={s.emoji}>{def?.emoji ?? "📄"}</span>
                    <span style={s.sectionLabel}>{def?.label ?? sec.type}</span>
                    <span style={s.sortOrder}>#{idx + 1}</span>
                  </div>
                  <div style={s.sectionActions}>
                    <button onClick={() => moveSection(sec.id, "up")} disabled={idx === 0 || loading} style={s.iconBtn} title="Move up">↑</button>
                    <button onClick={() => moveSection(sec.id, "down")} disabled={idx === sections.length - 1 || loading} style={s.iconBtn} title="Move down">↓</button>
                    <button
                      onClick={() => {
                        if (isEditing) { setEditingId(null); }
                        else { setEditingId(sec.id); setEditContent(sec.content as Record<string, unknown>); }
                      }}
                      style={{ ...s.iconBtn, color: isEditing ? "#7c3aed" : "#374151" }}
                    >
                      {isEditing ? "✕" : "✏"}
                    </button>
                    <button onClick={() => deleteSection(sec.id)} disabled={loading} style={{ ...s.iconBtn, color: "#dc2626" }}>🗑</button>
                  </div>
                </div>

                {isEditing && (
                  <div style={s.editor}>
                    <SectionEditor type={sec.type} content={editContent} onChange={setEditContent} />
                    <div style={s.editorActions}>
                      <button onClick={() => setEditingId(null)} style={s.cancelBtn}>Cancel</button>
                      <button onClick={() => saveSection(sec.id)} disabled={loading} style={s.saveBtn}>
                        {loading ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!maxReached ? (
        <div style={s.addSection}>
          <p style={s.addLabel}>Add section:</p>
          <div style={s.typeGrid}>
            {availableTypes.map((def) => (
              <button key={def.type} onClick={() => addSection(def)} disabled={loading} style={s.typeBtn}>
                <span>{def.emoji}</span>
                <span>{def.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={s.limitMsg}>Section limit reached ({pkg?.maxSections}). Upgrade to add more.</div>
      )}
    </div>
  );
}

function SectionEditor({
  type,
  content,
  onChange,
}: {
  type: string;
  content: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  function set(key: string, value: unknown) {
    onChange({ ...content, [key]: value });
  }

  const inp = { padding: "0.5rem 0.625rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" };

  if (type === "cover") {
    return (
      <div style={eg}>
        <F label="Heading"><input value={(content.heading as string) ?? ""} onChange={(e) => set("heading", e.target.value)} style={inp} /></F>
        <F label="Subheading"><input value={(content.subheading as string) ?? ""} onChange={(e) => set("subheading", e.target.value)} style={inp} /></F>
      </div>
    );
  }
  if (type === "countdown") {
    return (
      <div style={eg}>
        <F label="Target date & time"><input type="datetime-local" value={(content.targetDate as string) ?? ""} onChange={(e) => set("targetDate", e.target.value)} style={inp} /></F>
        <F label="Label"><input value={(content.label as string) ?? ""} onChange={(e) => set("label", e.target.value)} style={inp} /></F>
      </div>
    );
  }
  if (type === "details") {
    const items = (content.items as Array<{ icon: string; label: string; value: string }>) ?? [];
    return (
      <div style={eg}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "50px 1fr 1fr auto", gap: "0.5rem", alignItems: "center" }}>
            <input value={item.icon} onChange={(e) => { const n = [...items]; n[i] = { ...item, icon: e.target.value }; set("items", n); }} style={{ ...inp, width: "100%" }} placeholder="Icon" />
            <input value={item.label} onChange={(e) => { const n = [...items]; n[i] = { ...item, label: e.target.value }; set("items", n); }} style={{ ...inp, width: "100%" }} placeholder="Label" />
            <input value={item.value} onChange={(e) => { const n = [...items]; n[i] = { ...item, value: e.target.value }; set("items", n); }} style={{ ...inp, width: "100%" }} placeholder="Value" />
            <button onClick={() => set("items", items.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "1rem" }}>✕</button>
          </div>
        ))}
        {items.length < 10 && (
          <button onClick={() => set("items", [...items, { icon: "📌", label: "", value: "" }])} style={{ fontSize: "0.8125rem", color: "#7c3aed", background: "none", border: "1px dashed #c4b5fd", borderRadius: "6px", padding: "0.375rem 0.75rem", cursor: "pointer" }}>
            + Add row
          </button>
        )}
      </div>
    );
  }
  if (type === "agenda") {
    const items = (content.items as Array<{ time?: string; timeEn?: string; title?: string; icon?: number | string }>) ?? [];
    return (
      <div style={eg}>
        <F label="Title"><input value={(content.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} style={inp} placeholder="Order of Ceremony" /></F>
        <F label="Subtitle"><input value={(content.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} style={inp} placeholder="Agenda" /></F>
        {items.map((item, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "64px 1fr 1.4fr auto", gap: "0.5rem", alignItems: "center" }}>
            <select value={String(item.icon ?? 1)} onChange={(e) => { const n = [...items]; n[i] = { ...item, icon: Number(e.target.value) }; set("items", n); }} style={inp} title="Icon">
              {[1,2,3,4,5,6,7,8,9].map((n) => <option key={n} value={n}>#{n}</option>)}
            </select>
            <input value={item.time ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...item, time: e.target.value }; set("items", n); }} style={inp} placeholder="Time" />
            <input value={item.title ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...item, title: e.target.value }; set("items", n); }} style={inp} placeholder="Activity" />
            <button onClick={() => set("items", items.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "1rem" }}>✕</button>
          </div>
        ))}
        {items.length < 12 && (
          <button onClick={() => set("items", [...items, { time: "", title: "", icon: ((items.length % 9) + 1) }])} style={{ fontSize: "0.8125rem", color: "#7c3aed", background: "none", border: "1px dashed #c4b5fd", borderRadius: "6px", padding: "0.375rem 0.75rem", cursor: "pointer" }}>
            + Add agenda item
          </button>
        )}
      </div>
    );
  }
  if (type === "gallery") {
    return (
      <div style={eg}>
        <F label="Layout">
          <select value={(content.layout as string) ?? "grid"} onChange={(e) => set("layout", e.target.value)} style={inp}>
            <option value="grid">Grid</option>
            <option value="masonry">Masonry</option>
            <option value="slideshow">Slideshow</option>
          </select>
        </F>
      </div>
    );
  }
  if (type === "video") {
    return (
      <div style={eg}>
        <F label="Video URL (YouTube/Vimeo embed)"><input value={(content.url as string) ?? ""} onChange={(e) => set("url", e.target.value)} style={inp} placeholder="https://youtube.com/embed/..." /></F>
        <F label="Caption"><input value={(content.caption as string) ?? ""} onChange={(e) => set("caption", e.target.value)} style={inp} /></F>
      </div>
    );
  }
  if (type === "wishing") {
    return (
      <div style={eg}>
        <F label="Placeholder text"><input value={(content.placeholder as string) ?? ""} onChange={(e) => set("placeholder", e.target.value)} style={inp} /></F>
      </div>
    );
  }
  if (type === "khqr") {
    return (
      <div style={eg}>
        <F label="Recipient name"><input value={(content.recipientName as string) ?? ""} onChange={(e) => set("recipientName", e.target.value)} style={inp} /></F>
        <F label="Amount"><input value={(content.amount as string) ?? ""} onChange={(e) => set("amount", e.target.value)} style={inp} placeholder="e.g. 50" /></F>
        <F label="QR code image URL"><input value={(content.qrImageUrl as string) ?? ""} onChange={(e) => set("qrImageUrl", e.target.value)} style={inp} placeholder="https://..." /></F>
      </div>
    );
  }
  return <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No editor for this section type.</p>;
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const eg = { display: "flex", flexDirection: "column" as const, gap: "0.625rem" };

const s = {
  header: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" },
  heading: { margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a" },
  count: { fontSize: "0.8125rem", color: "#94a3b8" },
  empty: { padding: "2rem", textAlign: "center" as const, color: "#94a3b8", fontSize: "0.875rem" },
  list: { display: "flex", flexDirection: "column" as const, gap: "0.5rem", marginBottom: "1.5rem" },
  sectionRow: {
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  sectionTop: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem" },
  sectionInfo: { display: "flex", alignItems: "center", gap: "0.5rem" },
  emoji: { fontSize: "1rem" },
  sectionLabel: { fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" },
  sortOrder: { fontSize: "0.75rem", color: "#94a3b8" },
  sectionActions: { display: "flex", gap: "0.25rem" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0.375rem", borderRadius: "4px", fontSize: "0.9375rem", color: "#374151" },
  editor: { padding: "0.875rem 1rem", borderTop: "1px solid #f1f5f9", background: "#fafafa" },
  editorActions: { display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.875rem" },
  cancelBtn: { padding: "0.375rem 0.75rem", background: "transparent", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem" },
  saveBtn: { padding: "0.375rem 0.75rem", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 },
  addSection: { marginTop: "1rem" },
  addLabel: { fontSize: "0.8125rem", fontWeight: 500, color: "#374151", margin: "0 0 0.5rem" },
  typeGrid: { display: "flex", gap: "0.5rem", flexWrap: "wrap" as const },
  typeBtn: {
    padding: "0.5rem 0.875rem",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    color: "#374151",
  },
  limitMsg: { marginTop: "1rem", padding: "0.75rem", background: "#fef9c3", borderRadius: "8px", fontSize: "0.875rem", color: "#854d0e" },
} as const;
