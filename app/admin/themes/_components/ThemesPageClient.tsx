"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TemplateRow {
  id: string;
  name: string;
  isActive: boolean;
  coverUrl: string | null;
  backgroundUrl: string | null;
  thumbnailUrl: string | null;
  overlayConfig: Record<string, unknown> | null;
  packageIds: string[];
}
interface PackageRow {
  id: string;
  name: string;
  slug: string;
}
interface Props {
  templates: TemplateRow[];
  packages: PackageRow[];
}

// Pull a couple of representative colors out of the saved builder draft so the
// card shows a meaningful swatch even when there's no cover image.
function paletteOf(overlay: Record<string, unknown> | null): string[] {
  const draft = (overlay?.builderDraft ?? {}) as Record<string, unknown>;
  const cover = (draft.coverBg ?? {}) as Record<string, unknown>;
  const content = (draft.contentBg ?? {}) as Record<string, unknown>;
  const block = (Array.isArray(draft.coverBlocks) ? draft.coverBlocks[0] : {}) as Record<string, unknown>;
  return [
    (cover.color as string) || "#1b2430",
    (content.color as string) || "#11151c",
    (block.color as string) || "#ffffff",
  ];
}

export function ThemesPageClient({ templates, packages }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createTemplate() {
    const name = window.prompt("Name this template theme:", "New Template");
    if (!name || !name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setCreating(false);
    if (!res.ok) { alert("Failed to create template"); return; }
    const { template } = (await res.json()) as { template: { id: string } };
    router.push(`/admin/themes/${template.id}`);
  }

  async function toggleActive(t: TemplateRow) {
    setBusyId(t.id);
    await fetch(`/api/admin/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(t: TemplateRow) {
    if (!window.confirm(`Delete template "${t.name}"? This can't be undone.`)) return;
    setBusyId(t.id);
    await fetch(`/api/admin/templates/${t.id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  async function togglePackage(t: TemplateRow, packageId: string) {
    const next = t.packageIds.includes(packageId)
      ? t.packageIds.filter((p) => p !== packageId)
      : [...t.packageIds, packageId];
    setBusyId(t.id);
    await fetch(`/api/admin/templates/${t.id}/packages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageIds: next }),
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.heading}>Theme Builder</h1>
          <p style={s.sub}>Reusable design templates. Tag each to the packages allowed to use it.</p>
        </div>
        <button onClick={createTemplate} disabled={creating} style={s.newBtn}>
          {creating ? "Creating…" : "+ New Template"}
        </button>
      </div>

      {templates.length === 0 ? (
        <div style={s.empty}>No templates yet. Create one to start building reusable themes.</div>
      ) : (
        <div style={s.grid}>
          {templates.map((t) => {
            const [c1, c2, c3] = paletteOf(t.overlayConfig);
            const img = t.thumbnailUrl || t.coverUrl || t.backgroundUrl;
            return (
              <div key={t.id} style={{ ...s.card, opacity: t.isActive ? 1 : 0.6 }}>
                <div style={s.imgWrap}>
                  {img ? (
                    <img src={img} alt={t.name} style={s.img} />
                  ) : (
                    <div style={{ ...s.swatch, background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}>
                      <span style={{ color: c3, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "1.4rem" }}>Aa</span>
                    </div>
                  )}
                </div>
                <div style={s.body}>
                  <div style={s.nameRow}>
                    <span style={s.name}>{t.name}</span>
                    <span style={{ ...s.badge, ...(t.isActive ? s.badgeOn : s.badgeOff) }}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div style={s.pkgLabel}>Allowed packages</div>
                  <div style={s.pkgRow}>
                    {packages.map((p) => {
                      const on = t.packageIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={busyId === t.id}
                          onClick={() => togglePackage(t, p.id)}
                          style={{ ...s.chip, ...(on ? s.chipOn : {}) }}
                          title={on ? "Click to remove" : "Click to allow"}
                        >
                          {on ? "✓ " : ""}{p.name}
                        </button>
                      );
                    })}
                  </div>

                  <div style={s.actions}>
                    <a href={`/admin/themes/${t.id}`} style={s.editBtn}>Edit design</a>
                    <button onClick={() => toggleActive(t)} disabled={busyId === t.id} style={s.ghostBtn}>
                      {t.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => remove(t)} disabled={busyId === t.id} style={s.delBtn}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "0.75rem", flexWrap: "wrap" as const },
  heading: { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" },
  sub: { margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--c-muted)" },
  newBtn: { padding: "0.5rem 1rem", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, flexShrink: 0 },
  empty: { padding: "3rem", textAlign: "center" as const, color: "var(--c-muted)", border: "1px dashed var(--c-border)", borderRadius: 12, background: "var(--c-surface)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" },
  card: { border: "1px solid var(--c-border)", borderRadius: 12, overflow: "hidden", background: "var(--c-surface)", display: "flex", flexDirection: "column" as const },
  imgWrap: { aspectRatio: "16 / 10", background: "var(--c-surface-2)", overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" as const, display: "block" },
  swatch: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  body: { padding: "0.875rem 1rem", display: "flex", flexDirection: "column" as const, gap: "0.625rem" },
  nameRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" },
  name: { fontSize: "0.9375rem", fontWeight: 700, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  badge: { fontSize: "0.6875rem", fontWeight: 700, padding: "0.125rem 0.5rem", borderRadius: 999, flexShrink: 0 },
  badgeOn: { background: "#dcfce7", color: "#15803d" },
  badgeOff: { background: "var(--c-surface-2)", color: "var(--c-muted)" },
  pkgLabel: { fontSize: "0.6875rem", fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  pkgRow: { display: "flex", flexWrap: "wrap" as const, gap: "0.375rem" },
  chip: { padding: "0.25rem 0.625rem", borderRadius: 999, border: "1px solid var(--c-border)", background: "var(--c-surface-2)", color: "var(--c-muted)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" },
  chipOn: { background: "var(--c-accent-soft)", borderColor: "var(--c-accent)", color: "var(--c-accent)" },
  actions: { display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.25rem", flexWrap: "wrap" as const },
  editBtn: { padding: "0.4rem 0.75rem", background: "var(--c-accent)", color: "#fff", borderRadius: 7, textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 },
  ghostBtn: { padding: "0.4rem 0.75rem", background: "var(--c-surface)", color: "var(--c-text)", border: "1px solid var(--c-border)", borderRadius: 7, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 },
  delBtn: { padding: "0.4rem 0.75rem", background: "transparent", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, marginLeft: "auto" },
} as const;
