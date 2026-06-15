"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }

    router.push(data.redirectTo as string);
    router.refresh();
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>Anjeurn</div>
        <h1 style={s.heading}>Sign in to your account</h1>
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email address</label>
            <input name="email" type="email" required autoComplete="email" style={s.input} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input name="password" type="password" required autoComplete="current-password" style={s.input} />
          </div>
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.button}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f4f5",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "400px",
  },
  brand: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#111",
    marginBottom: "1.5rem",
    letterSpacing: "-0.02em",
  },
  heading: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#111",
    margin: "0 0 1.5rem",
  },
  form: { display: "flex", flexDirection: "column" as const, gap: "1rem" },
  field: { display: "flex", flexDirection: "column" as const, gap: "0.375rem" },
  label: { fontSize: "0.875rem", fontWeight: 500, color: "#374151" },
  input: {
    padding: "0.625rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.9375rem",
    outline: "none",
    transition: "border-color 0.15s",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  error: {
    margin: 0,
    padding: "0.625rem 0.75rem",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#dc2626",
    fontSize: "0.875rem",
  },
  button: {
    marginTop: "0.25rem",
    padding: "0.75rem",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "-0.01em",
  },
} as const;
