"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PackageOption {
  id: string;
  name: string;
  price: number;
}

interface Props {
  userId: string;
  packages: PackageOption[];
  /** Currently active packageId, to preselect / label. */
  currentPackageId?: string;
}

// Grant or switch a client's package. Revokes the active one and activates the
// chosen package (server-side), so the client's events inherit the new tier.
export function GrantPackage({ userId, packages, currentPackageId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [packageId, setPackageId] = useState(currentPackageId ?? "");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function grant() {
    if (!packageId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${userId}/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, expiresAt: expiresAt || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to grant package");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ ...s.btn, ...s.purple }}>
        {currentPackageId ? "Change package" : "Grant package"}
      </button>
    );
  }

  return (
    <div style={s.panel}>
      <select value={packageId} onChange={(e) => setPackageId(e.target.value)} style={s.input}>
        <option value="" disabled>Select package…</option>
        {packages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} (${p.price})
          </option>
        ))}
      </select>
      <label style={s.field}>
        <span style={s.fieldLabel}>Expires (optional)</span>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          style={s.input}
        />
      </label>
      {error && <p style={s.error}>{error}</p>}
      <div style={s.actions}>
        <button onClick={grant} disabled={loading || !packageId} style={{ ...s.btn, ...s.purple }}>
          {loading ? "Granting…" : "Grant"}
        </button>
        <button onClick={() => setOpen(false)} disabled={loading} style={{ ...s.btn, ...s.gray }}>
          Cancel
        </button>
      </div>
      <p style={s.hint}>The current active package will be revoked.</p>
    </div>
  );
}

const s = {
  panel: { display: "flex", flexDirection: "column" as const, gap: "0.5rem", marginTop: "0.75rem", padding: "0.75rem", background: "var(--c-accent-soft)", border: "1px solid var(--c-border)", borderRadius: "8px" },
  field: { display: "flex", flexDirection: "column" as const, gap: "0.25rem" },
  fieldLabel: { fontSize: "0.75rem", color: "var(--c-muted)" },
  input: { padding: "0.4rem 0.6rem", border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-text)", borderRadius: "6px", fontSize: "0.8125rem", fontFamily: "inherit" },
  actions: { display: "flex", gap: "0.5rem" },
  error: { color: "#dc2626", fontSize: "0.8125rem", margin: 0 },
  hint: { color: "var(--c-muted)", fontSize: "0.75rem", margin: 0 },
  btn: { padding: "0.3125rem 0.75rem", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, whiteSpace: "nowrap" as const },
  purple: { background: "var(--c-accent)", color: "var(--c-lime-text)" },
  gray: { background: "var(--c-surface-2)", color: "var(--c-text)" },
} as const;
