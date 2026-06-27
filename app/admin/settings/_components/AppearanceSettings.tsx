"use client";

import { useState } from "react";
import type {
  SiteSettings,
  EntranceStyle,
  TransitionStyle,
} from "@/lib/services/site-settings.service";

type SaveState = "idle" | "saving" | "saved" | "error";

const ENTRANCE_OPTIONS: { value: EntranceStyle; label: string; desc: string }[] = [
  { value: "none",    label: "None",      desc: "Content appears instantly." },
  { value: "fade",    label: "Fade in",   desc: "Sections gently fade up in sequence." },
  { value: "slideUp", label: "Slide up",  desc: "Sections rise into place as they appear." },
  { value: "zoom",    label: "Zoom in",   desc: "Sections scale up softly on load." },
];

const TRANSITION_OPTIONS: { value: TransitionStyle; label: string; desc: string }[] = [
  { value: "none",  label: "None",   desc: "Instant page swap (default browser)." },
  { value: "fade",  label: "Fade",   desc: "New page fades in on navigation." },
  { value: "slide", label: "Slide",  desc: "New page slides up as it fades in." },
];

export function AppearanceSettings({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState<SiteSettings>(initial);
  const [state, setState] = useState<SaveState>("idle");

  async function save(patch: Partial<SiteSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    setState("saving");
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      setState("saved");
      setTimeout(() => setState("idle"), 1600);
    } catch {
      setState("error");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Group
        title="Page-load entrance"
        sub="How the landing site reveals its content when first opened."
      >
        {ENTRANCE_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            desc={o.desc}
            active={settings.entranceStyle === o.value}
            onClick={() => save({ entranceStyle: o.value })}
            previewKind="entrance"
            previewStyle={o.value}
          />
        ))}
      </Group>

      <Group
        title="Page-to-page transition"
        sub="How pages animate when navigating between routes (e.g. → Log in)."
      >
        {TRANSITION_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            desc={o.desc}
            active={settings.transitionStyle === o.value}
            onClick={() => save({ transitionStyle: o.value })}
            previewKind="transition"
            previewStyle={o.value}
          />
        ))}
      </Group>

      <div style={{ minHeight: 22, fontSize: "0.85rem", fontWeight: 600 }}>
        {state === "saving" && <span style={{ color: "var(--c-muted)" }}>Saving…</span>}
        {state === "saved" && <span style={{ color: "#15803d" }}>✓ Saved — live on the site</span>}
        {state === "error" && <span style={{ color: "#b3261e" }}>Couldn’t save. Try again.</span>}
      </div>
    </div>
  );
}

function Group({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="brand-panel">
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--brand-serif)", fontSize: "1.2rem", color: "var(--c-text)" }}>{title}</h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--c-muted)" }}>{sub}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.75rem" }}>
        {children}
      </div>
    </div>
  );
}

function OptionCard({
  label, desc, active, onClick, previewKind, previewStyle,
}: {
  label: string; desc: string; active: boolean; onClick: () => void;
  previewKind: "entrance" | "transition"; previewStyle: string;
}) {
  // Replay the mini-preview each time it's hovered/focused by remounting via key.
  const [k, setK] = useState(0);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setK((x) => x + 1)}
      style={{
        textAlign: "left",
        border: `2px solid ${active ? "var(--c-accent)" : "var(--c-border)"}`,
        background: active ? "var(--c-accent-soft)" : "var(--c-surface)",
        borderRadius: 12,
        padding: "0.85rem",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        fontFamily: "inherit",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ height: 54, borderRadius: 8, background: "var(--c-surface-2)", border: "1px solid var(--c-border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span
          key={k}
          className={`pv pv-${previewKind}-${previewStyle}`}
          style={{ width: 30, height: 30, borderRadius: 6, background: "var(--c-accent)", display: "block" }}
        />
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--c-text)" }}>{label}</span>
          {active && <span style={{ color: "var(--c-accent)", fontWeight: 800 }}>✓</span>}
        </div>
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--c-muted)", lineHeight: 1.4 }}>{desc}</p>
      </div>
    </button>
  );
}
