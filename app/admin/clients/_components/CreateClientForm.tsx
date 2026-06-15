"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Package } from "@/types";

interface CreateClientFormProps {
  packages: Pick<Package, "id" | "name" | "slug">[];
  onClose: () => void;
}

export function CreateClientForm({ packages, onClose }: CreateClientFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
      packageId: fd.get("packageId"),
      expiresAt: fd.get("expiresAt") || null,
      notes: fd.get("notes") || null,
    };

    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create client");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>New Client</h2>
          <button onClick={onClose} style={s.close}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={s.form}>
          <Field label="Full name">
            <input name="name" type="text" required style={s.input} />
          </Field>
          <Field label="Email address">
            <input name="email" type="email" required style={s.input} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" required minLength={8} style={s.input} />
          </Field>
          <Field label="Package">
            <select name="packageId" required style={s.input}>
              <option value="">Select a package…</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Expiry date (optional)">
            <input name="expiresAt" type="date" style={s.input} />
          </Field>
          <Field label="Notes (optional)">
            <textarea name="notes" rows={3} style={{ ...s.input, resize: "vertical" as const }} />
          </Field>

          {error && <p style={s.error}>{error}</p>}

          <div style={s.actions}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? "Creating…" : "Create client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  modal: {
    background: "#fff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "480px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid #e5e7eb",
  },
  title: { margin: 0, fontSize: "1rem", fontWeight: 600 },
  close: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    fontSize: "1rem",
    padding: "0.25rem",
  },
  form: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  input: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.9375rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  error: {
    margin: 0,
    padding: "0.5rem 0.75rem",
    background: "#fef2f2",
    borderRadius: "6px",
    color: "#dc2626",
    fontSize: "0.875rem",
  },
  actions: { display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" },
  cancelBtn: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  submitBtn: {
    padding: "0.5rem 1rem",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
} as const;
