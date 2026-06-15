"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ForceUnpublishButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm("Force unpublish this invitation? The guest page will go offline.")) return;
    setLoading(true);
    await fetch(`/api/admin/invitations/${invitationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "force-unpublish" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handle} disabled={loading} style={s.btn}>
      {loading ? "…" : "Unpublish"}
    </button>
  );
}

const s = {
  btn: {
    padding: "0.25rem 0.625rem",
    background: "#fee2e2",
    color: "#991b1b",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 500,
  },
} as const;
