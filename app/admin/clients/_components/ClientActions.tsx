"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClientActionsProps {
  userPackageId: string;
  status: string;
}

export function ClientActions({ userPackageId, status }: ClientActionsProps) {
  const router = useRouter();
  const [extendDate, setExtendDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch(`/api/admin/clients/${userPackageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("Action failed");
  }

  if (status === "revoked") {
    return (
      <button onClick={() => patch({ action: "reactivate" })} disabled={loading} className="btn-pill btn-view">
        <span className="bi" aria-hidden>↺</span>
        <span className="bl">Reactivate</span>
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
      <button onClick={() => patch({ action: "revoke" })} disabled={loading} className="btn-pill btn-unpublish">
        <span className="bi" aria-hidden>⊘</span>
        <span className="bl">Revoke</span>
      </button>
      <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
        <input
          type="date"
          value={extendDate}
          onChange={(e) => setExtendDate(e.target.value)}
          style={{ padding: "0.28rem 0.5rem", border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-text)", borderRadius: "5px", fontSize: "0.78rem" }}
          min={new Date().toISOString().slice(0, 10)}
        />
        <button
          onClick={() => extendDate && patch({ action: "extend", expiresAt: extendDate })}
          disabled={loading || !extendDate}
          className="btn-pill btn-edit"
        >
          Extend
        </button>
      </div>
    </div>
  );
}
