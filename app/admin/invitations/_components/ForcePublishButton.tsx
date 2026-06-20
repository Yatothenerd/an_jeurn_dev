"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ForcePublishButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await fetch(`/api/admin/invitations/${invitationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "force-publish" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handle} disabled={loading} className="btn-pill btn-view" title="Publish">
      <span className="bi" aria-hidden>↑</span>
      <span className="bl">{loading ? "…" : "Publish"}</span>
    </button>
  );
}
