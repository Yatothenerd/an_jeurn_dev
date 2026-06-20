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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 className="page-title" style={{ margin: 0 }}>Clients</h1>
        <button onClick={() => setShowForm(true)} className="btn-pill" style={{ background: "var(--c-accent)", color: "#fff" }}>
          + New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="admin-card data-empty">No clients yet. Create one to get started.</div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Package</th>
                <th>Status</th>
                <th className="col-hide-sm">Expires</th>
                <th className="col-hide-sm">Joined</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const up = c.userPackages[0];
                return (
                  <tr key={c.id}>
                    <td data-label="Name">
                      <Link href={`/admin/clients/${c.id}`} style={{ color: "var(--c-accent)", textDecoration: "none", fontWeight: 600 }}>
                        {c.name}
                      </Link>
                    </td>
                    <td data-label="Email" style={{ color: "var(--c-muted)" }}>{c.email}</td>
                    <td data-label="Package">{up?.package.name ?? "—"}</td>
                    <td data-label="Status"><StatusBadge status={up?.status ?? "none"} /></td>
                    <td data-label="Expires" className="col-hide-sm" style={{ color: "var(--c-muted)" }}>
                      {up?.expiresAt ? new Date(up.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td data-label="Joined" className="col-hide-sm" style={{ color: "var(--c-muted)" }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td data-label="Actions" className="actions">
                      {up ? <ClientActions userPackageId={up.id} status={up.status} /> : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <CreateClientForm packages={packages} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    active: { bg: "#dcfce7", color: "#15803d" },
    expired: { bg: "#fef9c3", color: "#854d0e" },
    revoked: { bg: "#fee2e2", color: "#b91c1c" },
    none: { bg: "var(--c-surface-2)", color: "var(--c-muted)" },
  };
  const c = colors[status] ?? colors.none;
  return <span className="status-pill" style={{ background: c.bg, color: c.color, textTransform: "capitalize" }}>{status}</span>;
}
