"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Anniversary", "Corporate", "Other"];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/dashboard/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        eventType: fd.get("eventType"),
        eventDate: fd.get("eventDate"),
        venueName: fd.get("venueName") || null,
        venueMapUrl: fd.get("venueMapUrl") || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create event");
      return;
    }

    router.push(`/dashboard/events/${data.eventId}/builder`);
  }

  return (
    <div style={s.page}>
      <div style={s.breadcrumb}>
        <Link href="/dashboard" style={s.backLink}>← My Events</Link>
      </div>
      <h1 style={s.heading}>Create New Event</h1>

      <div style={s.card}>
        <form onSubmit={handleSubmit} style={s.form}>
          <Field label="Event title *">
            <input name="title" type="text" required placeholder="e.g. John & Jane Wedding" style={s.input} />
          </Field>

          <Field label="Event type *">
            <select name="eventType" required style={s.input}>
              <option value="">Select event type…</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t.toLowerCase()}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Event date *">
            <input name="eventDate" type="date" required style={s.input} />
          </Field>

          <Field label="Venue name">
            <input name="venueName" type="text" placeholder="e.g. Grand Ballroom Hotel" style={s.input} />
          </Field>

          <Field label="Venue map URL">
            <input name="venueMapUrl" type="url" placeholder="https://maps.google.com/..." style={s.input} />
          </Field>

          {error && <p style={s.error}>{error}</p>}

          <div style={s.actions}>
            <Link href="/dashboard" style={s.cancelBtn}>Cancel</Link>
            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? "Creating…" : "Create & Open Builder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  page: { maxWidth: "560px" },
  breadcrumb: { marginBottom: "1rem" },
  backLink: { color: "#64748b", textDecoration: "none", fontSize: "0.875rem" },
  heading: { margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  form: { display: "flex", flexDirection: "column" as const, gap: "1.25rem" },
  input: {
    padding: "0.625rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.9375rem",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    background: "#fff",
  },
  error: {
    margin: 0,
    padding: "0.625rem 0.75rem",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#dc2626",
    fontSize: "0.875rem",
  },
  actions: { display: "flex", gap: "0.75rem", justifyContent: "flex-end", alignItems: "center" },
  cancelBtn: {
    padding: "0.625rem 1rem",
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.9375rem",
    color: "#374151",
    textDecoration: "none",
  },
  submitBtn: {
    padding: "0.625rem 1.25rem",
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: "pointer",
  },
} as const;
