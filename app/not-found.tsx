import Link from "next/link";

export default function NotFound() {
  return (
    <div style={s.page}>
      <h1 style={s.code}>404</h1>
      <p style={s.message}>This page doesn&apos;t exist.</p>
      <Link href="/" style={s.link}>Go home</Link>
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
  link: { color: "#7c3aed", textDecoration: "none", fontWeight: 600, fontSize: "0.9375rem" },
} as const;
