"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={s.page}>
      <h1 style={s.code}>500</h1>
      <p style={s.message}>Something went wrong.</p>
      {process.env.NODE_ENV === "development" && (
        <pre style={s.detail}>{error.message}</pre>
      )}
      <button onClick={reset} style={s.btn}>Try again</button>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    fontFamily: "system-ui, sans-serif",
    background: "#f9fafb",
  },
  code: { margin: 0, fontSize: "5rem", fontWeight: 700, color: "#e5e7eb", lineHeight: 1 },
  message: { margin: 0, fontSize: "1.125rem", color: "#6b7280" },
  detail: { maxWidth: "480px", fontSize: "0.8125rem", color: "#ef4444", background: "#fff", padding: "0.75rem", borderRadius: "8px", overflow: "auto" },
  btn: { padding: "0.625rem 1.25rem", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.9375rem", fontWeight: 600 },
} as const;
