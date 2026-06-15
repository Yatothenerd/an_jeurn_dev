"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Theme } from "@/types";

interface ThemeFormModalProps {
  theme?: Theme;
  onClose: () => void;
}

export function ThemeFormModal({ theme, onClose }: ThemeFormModalProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(theme?.isAnimated ?? false);

  const isEdit = !!theme;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    let previewUrl = theme?.previewUrl ?? null;
    let thumbnailUrl = theme?.thumbnailUrl ?? null;

    // Upload preview image if provided
    const previewFile = fd.get("previewFile") as File;
    if (previewFile?.size) {
      const uploadFd = new FormData();
      uploadFd.append("file", previewFile);
      uploadFd.append("folder", "themes/preview");
      const up = await fetch("/api/admin/upload", { method: "POST", body: uploadFd });
      if (!up.ok) { setError("Preview upload failed"); setLoading(false); return; }
      previewUrl = (await up.json()).url;
    }

    // Upload thumbnail if provided
    const thumbFile = fd.get("thumbnailFile") as File;
    if (thumbFile?.size) {
      const uploadFd = new FormData();
      uploadFd.append("file", thumbFile);
      uploadFd.append("folder", "themes/thumbnails");
      const up = await fetch("/api/admin/upload", { method: "POST", body: uploadFd });
      if (!up.ok) { setError("Thumbnail upload failed"); setLoading(false); return; }
      thumbnailUrl = (await up.json()).url;
    }

    const body = {
      name: fd.get("name"),
      previewUrl,
      thumbnailUrl,
      isAnimated,
      sortOrder: Number(fd.get("sortOrder") ?? 0),
    };

    const url = isEdit ? `/api/admin/themes/${theme.id}` : "/api/admin/themes";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to save theme"); return; }

    router.refresh();
    onClose();
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>{isEdit ? "Edit Theme" : "New Theme"}</h2>
          <button onClick={onClose} style={s.close}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={s.form}>
          <Field label="Theme name">
            <input name="name" defaultValue={theme?.name} type="text" required style={s.input} />
          </Field>
          <Field label="Preview image (JPG/PNG/WebP, max 5 MB)">
            <input name="previewFile" type="file" accept="image/*" style={s.input} />
            {theme?.previewUrl && (
              <img src={theme.previewUrl} alt="preview" style={s.preview} />
            )}
          </Field>
          <Field label="Thumbnail (JPG/PNG/WebP, max 5 MB)">
            <input name="thumbnailFile" type="file" accept="image/*" style={s.input} />
            {theme?.thumbnailUrl && (
              <img src={theme.thumbnailUrl} alt="thumbnail" style={s.preview} />
            )}
          </Field>
          <Field label="Sort order">
            <input name="sortOrder" type="number" defaultValue={theme?.sortOrder ?? 0} style={s.input} />
          </Field>
          <label style={s.toggleRow}>
            <input
              type="checkbox"
              checked={isAnimated}
              onChange={(e) => setIsAnimated(e.target.checked)}
            />
            <span style={{ fontSize: "0.875rem" }}>Animated theme</span>
          </label>

          {error && <p style={s.error}>{error}</p>}

          <div style={s.actions}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create theme"}
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
  close: { background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "1rem" },
  form: { padding: "1.5rem", display: "flex", flexDirection: "column" as const, gap: "1rem" },
  input: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.9375rem",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  preview: { width: "80px", height: "60px", objectFit: "cover" as const, borderRadius: "4px", border: "1px solid #e5e7eb" },
  toggleRow: { display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" },
  error: {
    margin: 0,
    padding: "0.5rem 0.75rem",
    background: "#fef2f2",
    borderRadius: "6px",
    color: "#dc2626",
    fontSize: "0.875rem",
  },
  actions: { display: "flex", gap: "0.75rem", justifyContent: "flex-end" },
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
