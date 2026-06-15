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
      <button
        onClick={() => patch({ action: "reactivate" })}
        disabled={loading}
        style={{ ...s.btn, ...s.green }}
      >
        Reactivate
      </button>
    );
  }

  return (
    <div style={s.wrap}>
      <button
        onClick={() => patch({ action: "revoke" })}
        disabled={loading}
        style={{ ...s.btn, ...s.red }}
      >
        Revoke
      </button>
      <div style={s.extend}>
        <input
          type="date"
          value={extendDate}
          onChange={(e) => setExtendDate(e.target.value)}
          style={s.dateInput}
          min={new Date().toISOString().slice(0, 10)}
        />
        <button
          onClick={() => extendDate && patch({ action: "extend", expiresAt: extendDate })}
          disabled={loading || !extendDate}
          style={{ ...s.btn, ...s.blue }}
        >
          Extend
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap: { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" as const },
  btn: {
    padding: "0.3125rem 0.625rem",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
  },
  red: { background: "#fee2e2", color: "#dc2626" },
  green: { background: "#dcfce7", color: "#16a34a" },
  blue: { background: "#dbeafe", color: "#2563eb" },
  extend: { display: "flex", gap: "0.375rem", alignItems: "center" },
  dateInput: {
    padding: "0.25rem 0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "5px",
    fontSize: "0.8125rem",
  },
} as const;
