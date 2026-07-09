"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Anniversary", "Corporate", "Other"];

interface EventData {
  id: string; title: string; eventType: string; eventDate: string;
  venueName: string; venueMapUrl: string; slug: string;
}
interface ClientData { name: string; email: string; packageName: string | null }

/** Step 1 — identity form. Autosaves (debounced) like every other step. */
export function DetailsForm({ event, client }: { event: EventData; client: ClientData }) {
  const [form, setForm] = useState({
    title: event.title,
    eventType: event.eventType,
    eventDate: event.eventDate.slice(0, 16),
    venueName: event.venueName,
    venueMapUrl: event.venueMapUrl,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          eventType: form.eventType,
          eventDate: form.eventDate,
          venueName: form.venueName || null,
          venueMapUrl: form.venueMapUrl || null,
        }),
      }).catch(() => null);
      setStatus(res?.ok ? "saved" : "error");
    }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [form, event.id]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.h2}>Event details</h2>
          <span style={s.status}>
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Save failed — edit to retry" : ""}
          </span>
        </div>

        <label style={s.field}>
          <span style={s.label}>Event title (internal)</span>
          <input style={s.input} value={form.title} onChange={(e) => set("title")(e.target.value)} />
          <span style={s.metaMuted}>Used to identify this event in the admin and in filenames — not shown to guests. Set the wording guests see under Content → Cover → &ldquo;Names / heading&rdquo;.</span>
        </label>
        <div style={s.row2}>
          <label style={s.field}>
            <span style={s.label}>Event type</span>
            <select style={s.input} value={form.eventType} onChange={(e) => set("eventType")(e.target.value)}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label style={s.field}>
            <span style={s.label}>Date & time</span>
            <input type="datetime-local" style={s.input} value={form.eventDate} onChange={(e) => set("eventDate")(e.target.value)} />
          </label>
        </div>
        <label style={s.field}>
          <span style={s.label}>Venue</span>
          <input style={s.input} value={form.venueName} onChange={(e) => set("venueName")(e.target.value)} placeholder="e.g. Sofitel Phnom Penh" />
        </label>
        <label style={s.field}>
          <span style={s.label}>Map URL</span>
          <input style={s.input} value={form.venueMapUrl} onChange={(e) => set("venueMapUrl")(e.target.value)} placeholder="https://maps.google.com/…" />
        </label>

        <div style={s.next}>
          <Link href={`/admin/events/${event.id}/design`} style={s.nextBtn}>Next: Design →</Link>
        </div>
      </div>

      <div style={s.side}>
        <div style={s.card}>
          <h2 style={s.h2}>Client</h2>
          <p style={s.meta}><strong>{client.name}</strong></p>
          <p style={s.meta}>{client.email}</p>
          <p style={s.meta}>
            Package: <strong>{client.packageName ?? "none (grant one under Clients)"}</strong>
          </p>
          <p style={s.metaMuted}>The package decides which templates and features are available in the next steps.</p>
        </div>
        <div style={s.card}>
          <h2 style={s.h2}>Link</h2>
          <p style={s.meta}>/invite/{event.slug}</p>
          <p style={s.metaMuted}>The public address once published. Guest-personalized links are created on the Guests page (header button).</p>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { display: "flex", gap: "1.25rem", alignItems: "flex-start", flexWrap: "wrap" as const },
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column" as const, gap: "0.8rem", flex: 1, minWidth: 320 },
  side: { display: "flex", flexDirection: "column" as const, gap: "1.25rem", width: 320, flexShrink: 0 },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  h2: { margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--c-text)" },
  status: { fontSize: "0.78rem", color: "var(--c-muted)" },
  field: { display: "flex", flexDirection: "column" as const, gap: 4 },
  label: { fontSize: "0.75rem", fontWeight: 600, color: "var(--c-muted)" },
  input: { width: "100%", boxSizing: "border-box" as const, padding: "0.55rem 0.7rem", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-text)", fontSize: "0.9rem", fontFamily: "inherit" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" },
  next: { display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" },
  nextBtn: { padding: "0.55rem 1.25rem", background: "var(--c-accent)", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 },
  meta: { margin: 0, fontSize: "0.875rem", color: "var(--c-text)" },
  metaMuted: { margin: 0, fontSize: "0.78rem", color: "var(--c-muted)", lineHeight: 1.45 },
} as const;
