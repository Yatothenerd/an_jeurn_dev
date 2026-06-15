"use client";

import { useState } from "react";
import Link from "next/link";
import { CreateClientForm } from "./CreateClientForm";
import { ClientActions } from "./ClientActions";
import type { Package } from "@/types";

interface ClientRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  userPackages: Array<{
    id: string;
    status: string;
    expiresAt: string | null;
    package: { name: string };
  }>;
}

interface Props {
  clients: ClientRow[];
  packages: Pick<Package, "id" | "name" | "slug">[];
}

export function ClientsPageClient({ clients, packages }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div style={s.pageHeader}>
        <h1 style={s.heading}>Clients</h1>
        <button onClick={() => setShowForm(true)} style={s.newBtn}>
          + New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div style={s.empty}>No clients yet. Create one to get started.</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Name", "Email", "Package", "Status", "Expires", "Joined", "Actions"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const up = c.userPackages[0];
                return (
                  <tr key={c.id} style={s.tr}>
                    <td style={s.td}>
                      <Link href={`/admin/clients/${c.id}`} style={s.link}>
                        {c.name}
                      </Link>
                    </td>
                    <td style={s.td}>{c.email}</td>
                    <td style={s.td}>{up?.package.name ?? "—"}</td>
                    <td style={s.td}>
                      <StatusBadge status={up?.status ?? "none"} />
                    </td>
                    <td style={s.td}>
                      {up?.expiresAt
                        ? new Date(up.expiresAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={s.td}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td style={s.td}>
                      {up ? (
                        <ClientActions userPackageId={up.id} status={up.status} />
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CreateClientForm packages={packages} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    active: { bg: "#dcfce7", color: "#15803d" },
    expired: { bg: "#fef9c3", color: "#854d0e" },
    revoked: { bg: "#fee2e2", color: "#b91c1c" },
    none: { bg: "#f3f4f6", color: "#6b7280" },
  };
  const c = colors[status] ?? colors.none;
  return (
    <span style={{ ...s.badge, background: c.bg, color: c.color }}>
      {status}
    </span>
  );
}

const s = {
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  heading: { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111" },
  newBtn: {
    padding: "0.5rem 1rem",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
  empty: {
    padding: "3rem",
    textAlign: "center" as const,
    color: "#6b7280",
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },
  tableWrap: { overflowX: "auto" as const },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  th: {
    padding: "0.75rem 1rem",
    textAlign: "left" as const,
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#111", verticalAlign: "middle" as const },
  link: { color: "#2563eb", textDecoration: "none", fontWeight: 500 },
  badge: {
    display: "inline-block",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize" as const,
  },
} as const;
