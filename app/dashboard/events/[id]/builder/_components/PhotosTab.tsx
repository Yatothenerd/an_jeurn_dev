"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { BuilderPhoto } from "./BuilderClient";

interface Props {
  invitationId: string;
  photos: BuilderPhoto[];
  maxPhotos: number;
  galleryType: string | null;
}

export function PhotosTab({ invitationId, photos, maxPhotos, galleryType }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const remaining = maxPhotos - photos.length;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    if (files.length > remaining) {
      setError(`You can only add ${remaining} more photo(s). Selected ${files.length}.`);
      return;
    }

    setError("");
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      setProgress(`Uploading ${i + 1} / ${files.length}…`);
      const fd = new FormData();
      fd.append("file", files[i]);
      fd.append("folder", "invitations/photos");

      const upRes = await fetch("/api/dashboard/upload", { method: "POST", body: fd });
      if (!upRes.ok) { setError("Upload failed"); break; }
      const { url } = await upRes.json();

      const saveRes = await fetch(`/api/dashboard/invitation/${invitationId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!saveRes.ok) {
        const d = await saveRes.json();
        setError(d.error ?? "Failed to save photo");
        break;
      }
    }

    setUploading(false);
    setProgress("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function deletePhoto(photoId: string) {
    if (!confirm("Remove this photo?")) return;
    await fetch(`/api/dashboard/invitation/${invitationId}/photos/${photoId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.heading}>Photos</h2>
        <div style={s.meta}>
          <span style={s.count}>{photos.length} / {maxPhotos}</span>
          {galleryType && <span style={s.galleryType}>{galleryType} gallery</span>}
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {remaining > 0 && (
        <label style={s.uploadZone}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
          {uploading ? (
            <span style={s.uploadText}>{progress}</span>
          ) : (
            <>
              <span style={s.uploadIcon}>📷</span>
              <span style={s.uploadText}>Click to upload photos</span>
              <span style={s.uploadSub}>{remaining} slot{remaining !== 1 ? "s" : ""} remaining · JPG, PNG, WebP up to 5 MB each</span>
            </>
          )}
        </label>
      )}

      {photos.length === 0 ? (
        <div style={s.empty}>No photos yet. Upload some above.</div>
      ) : (
        <div style={s.grid}>
          {photos.map((photo, idx) => (
            <div key={photo.id} style={s.photoCard}>
              <img src={photo.url} alt={`Photo ${idx + 1}`} style={s.img} />
              <div style={s.overlay}>
                <span style={s.photoNum}>#{idx + 1}</span>
                <button onClick={() => deletePhoto(photo.id)} style={s.deleteBtn} title="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {remaining === 0 && (
        <div style={s.limitMsg}>Photo limit reached ({maxPhotos}). Upgrade to add more.</div>
      )}
    </div>
  );
}

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  heading: { margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a" },
  meta: { display: "flex", gap: "0.5rem", alignItems: "center" },
  count: { fontSize: "0.8125rem", color: "#94a3b8" },
  galleryType: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    padding: "0.15rem 0.5rem",
    borderRadius: "4px",
    background: "#ede9fe",
    color: "#7c3aed",
    textTransform: "capitalize" as const,
  },
  error: {
    marginBottom: "0.75rem",
    padding: "0.625rem 0.75rem",
    background: "#fef2f2",
    borderRadius: "8px",
    color: "#dc2626",
    fontSize: "0.875rem",
  },
  uploadZone: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.375rem",
    padding: "2rem",
    border: "2px dashed #c4b5fd",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "1.25rem",
    background: "#faf5ff",
    transition: "background 0.15s",
  },
  uploadIcon: { fontSize: "1.75rem" },
  uploadText: { fontSize: "0.9375rem", fontWeight: 600, color: "#7c3aed" },
  uploadSub: { fontSize: "0.8125rem", color: "#94a3b8" },
  empty: { padding: "2rem", textAlign: "center" as const, color: "#94a3b8", fontSize: "0.875rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.625rem" },
  photoCard: {
    position: "relative" as const,
    borderRadius: "8px",
    overflow: "hidden",
    aspectRatio: "1",
    background: "#f1f5f9",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" as const, display: "block" },
  overlay: {
    position: "absolute" as const,
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: "0.5rem",
  },
  photoNum: { fontSize: "0.6875rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 },
  deleteBtn: {
    background: "rgba(0,0,0,0.5)",
    border: "none",
    color: "#fff",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.75rem",
    padding: "0.15rem 0.375rem",
  },
  limitMsg: { marginTop: "1rem", padding: "0.75rem", background: "#fef9c3", borderRadius: "8px", fontSize: "0.875rem", color: "#854d0e" },
} as const;
