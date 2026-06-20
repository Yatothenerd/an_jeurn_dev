"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublishButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function publish() {
    setError("");
    setBusy(true);
    const res = await fetch(`/api/dashboard/invitation/${invitationId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: true }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to publish");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button onClick={publish} disabled={busy} style={s.btn}>
        {busy ? "Publishing…" : "Publish"}
      </button>
      {error && <p style={s.error}>{error}</p>}
    </div>
  );
}

const s = {
  btn: {
    display: "block",
    width: "100%",
    padding: "0.5rem",
    background: "var(--c-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center" as const,
  },
  error: { margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#dc2626" },
} as const;
