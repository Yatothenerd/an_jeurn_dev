"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  email: string;
  packageName: string | null;
}

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Anniversary", "Corporate", "Other"];

export function NewEventForm({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: fd.get("userId"),
          title: fd.get("title"),
          eventType: fd.get("eventType"),
          eventDate: fd.get("eventDate"),
          venueName: fd.get("venueName") || null,
          venueMapUrl: fd.get("venueMapUrl") || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Failed to create event");
        return;
      }
      router.push("/admin/invitations");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (clients.length === 0) {
    return (
      <div style={s.note}>
        No clients yet. Create a client with an active package first, then come back to assign an event.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <label style={s.label}>
        Client
        <select name="userId" required defaultValue="" style={s.input}>
          <option value="" disabled>Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.email}){c.packageName ? ` — ${c.packageName}` : " — no package"}
            </option>
          ))}
        </select>
      </label>

      <label style={s.label}>
        Event title
        <input name="title" required placeholder="e.g. Sophea & Dara's Wedding" style={s.input} />
      </label>

      <div style={s.row}>
        <label style={{ ...s.label, flex: 1 }}>
          Event type
          <select name="eventType" required defaultValue="Wedding" style={s.input}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label style={{ ...s.label, flex: 1 }}>
          Event date
          <input name="eventDate" type="date" required style={s.input} />
        </label>
      </div>

      <label style={s.label}>
        Venue name (optional)
        <input name="venueName" placeholder="Venue / hall name" style={s.input} />
      </label>

      <label style={s.label}>
        Venue map URL (optional)
        <input name="venueMapUrl" type="url" placeholder="https://maps.google.com/…" style={s.input} />
      </label>

      {error && <p style={s.error}>{error}</p>}

      <button type="submit" disabled={loading} style={s.submit}>
        {loading ? "Creating…" : "Create & assign event"}
      </button>
    </form>
  );
}

const s = {
  form: { display: "flex", flexDirection: "column" as const, gap: "1rem", background: "var(--c-surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--c-border)" },
  label: { display: "flex", flexDirection: "column" as const, gap: "0.35rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--c-muted)" },
  row: { display: "flex", gap: "1rem", flexWrap: "wrap" as const },
  input: { padding: "0.6rem 0.75rem", border: "1px solid var(--c-border)", background: "transparent", borderRadius: "8px", fontSize: "0.9375rem", fontFamily: "inherit", outline: "none", fontWeight: 400, color: "var(--c-text)" },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: 0 },
  submit: { padding: "0.7rem 1rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.9375rem", fontWeight: 600 },
  note: { padding: "1.5rem", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "12px", color: "var(--c-muted)", fontSize: "0.9375rem" },
} as const;
