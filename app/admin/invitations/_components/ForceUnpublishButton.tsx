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
    <button onClick={handle} disabled={loading} className="btn-pill btn-unpublish" title="Unpublish">
      <span className="bi" aria-hidden>⊘</span>
      <span className="bl">{loading ? "…" : "Unpublish"}</span>
    </button>
  );
}
