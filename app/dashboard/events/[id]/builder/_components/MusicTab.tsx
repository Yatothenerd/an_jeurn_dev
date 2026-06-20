"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  invitationId: string;
  currentMusicUrl: string | null;
}

export function MusicTab({ invitationId, currentMusicUrl }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "invitations/music");

    const upRes = await fetch("/api/dashboard/upload", { method: "POST", body: fd });
    if (!upRes.ok) {
      const d = await upRes.json();
      setError(d.error ?? "Upload failed");
      setUploading(false);
      return;
    }

    const { url } = await upRes.json();
    const res = await fetch(`/api/dashboard/invitation/${invitationId}/music`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musicUrl: url }),
    });

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";

    if (!res.ok) { setError("Failed to save music"); return; }
    router.refresh();
  }

  async function removeMusic() {
    if (!confirm("Remove background music?")) return;
    await fetch(`/api/dashboard/invitation/${invitationId}/music`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musicUrl: null }),
    });
    router.refresh();
  }

  return (
    <div>
      <h2 style={s.heading}>Background Music</h2>
      <p style={s.sub}>Add background music that plays automatically when guests open the invitation.</p>

      {error && <div style={s.error}>{error}</div>}

      {currentMusicUrl ? (
        <div style={s.currentMusic}>
          <div style={s.musicIcon}>🎵</div>
          <div style={s.musicInfo}>
            <div style={s.musicLabel}>Music uploaded</div>
            <audio controls src={currentMusicUrl} style={s.audio} />
          </div>
          <button onClick={removeMusic} style={s.removeBtn}>Remove</button>
        </div>
      ) : (
        <label style={s.uploadZone}>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
          {uploading ? (
            <span style={s.uploadText}>Uploading…</span>
          ) : (
            <>
              <span style={s.uploadIcon}>🎵</span>
              <span style={s.uploadText}>Click to upload audio</span>
              <span style={s.uploadSub}>MP3, WAV, AAC up to 20 MB</span>
            </>
          )}
        </label>
      )}
    </div>
  );
}

const s = {
  heading: { margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 600, color: "var(--c-text)" },
  sub: { margin: "0 0 1.25rem", color: "var(--c-muted)", fontSize: "0.875rem" },
  error: { marginBottom: "0.75rem", padding: "0.625rem 0.75rem", background: "#fef2f2", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem" },
  currentMusic: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.25rem",
    background: "var(--c-surface)",
    borderRadius: "10px",
    border: "1px solid var(--c-border)",
  },
  musicIcon: { fontSize: "2rem" },
  musicInfo: { flex: 1, display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  musicLabel: { fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)" },
  audio: { width: "100%", maxWidth: "360px" },
  removeBtn: {
    padding: "0.375rem 0.75rem",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  uploadZone: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.375rem",
    padding: "2.5rem",
    border: "2px dashed var(--c-accent)",
    borderRadius: "10px",
    cursor: "pointer",
    background: "var(--c-accent-soft)",
  },
  uploadIcon: { fontSize: "2rem" },
  uploadText: { fontSize: "0.9375rem", fontWeight: 600, color: "var(--c-accent)" },
  uploadSub: { fontSize: "0.8125rem", color: "var(--c-muted)" },
} as const;
