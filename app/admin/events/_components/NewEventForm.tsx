"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  email: string;
  packageId: string | null;
  packageName: string | null;
}
interface TemplateOption {
  id: string;
  name: string;
  packageIds: string[];
}

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Anniversary", "Corporate", "Other"];

export function NewEventForm({ clients, templates = [] }: { clients: Client[]; templates?: TemplateOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");

  // Offer only templates allowed for the selected client's package.
  const selected = clients.find((c) => c.id === clientId);
  const availableTemplates = selected?.packageId
    ? templates.filter((t) => t.packageIds.includes(selected.packageId!))
    : [];

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
          templateId: fd.get("templateId") || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Failed to create event");
        return;
      }
      router.push(`/admin/events/${d.eventId as string}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (clients.length === 0) {
    return (
      <div className="brand-note">
        No clients yet. Create a client with an active package first, then come back to assign an event.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="brand-panel brand-form">
      <label className="brand-field">
        <span>Client</span>
        <select
          name="userId"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="brand-input"
        >
          <option value="" disabled>Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.email}){c.packageName ? ` — ${c.packageName}` : " — no package"}
            </option>
          ))}
        </select>
      </label>

      <label className="brand-field">
        <span>Template theme <small>(optional)</small></span>
        <select name="templateId" defaultValue="" className="brand-input" disabled={!selected}>
          <option value="">Start blank</option>
          {availableTemplates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <small style={{ color: "var(--c-muted)", fontSize: "0.75rem" }}>
          {!selected
            ? "Pick a client first to see templates for their package."
            : availableTemplates.length === 0
              ? "No templates tagged for this client's package yet."
              : "Applies the template's design to the new invitation."}
        </small>
      </label>

      <label className="brand-field">
        <span>Event title</span>
        <input name="title" required placeholder="e.g. Sophea & Dara's Wedding" className="brand-input" />
      </label>

      <div className="brand-row">
        <label className="brand-field">
          <span>Event type</span>
          <select name="eventType" required defaultValue="Wedding" className="brand-input">
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="brand-field">
          <span>Event date</span>
          <input name="eventDate" type="date" required className="brand-input" />
        </label>
      </div>

      <label className="brand-field">
        <span>Venue name <small>(optional)</small></span>
        <input name="venueName" placeholder="Venue / hall name" className="brand-input" />
      </label>

      <label className="brand-field">
        <span>Venue map URL <small>(optional)</small></span>
        <input name="venueMapUrl" type="url" placeholder="https://maps.google.com/…" className="brand-input" />
      </label>

      {error && <p className="brand-error">{error}</p>}

      <button type="submit" disabled={loading} className="brand-btn" style={{ alignSelf: "flex-start" }}>
        {loading ? "Creating…" : "Create & assign event"}
      </button>
    </form>
  );
}
