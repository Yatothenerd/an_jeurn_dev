"use client";

import { useRef, useState } from "react";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

// Drag-and-drop image picker with validation + live preview. Keeps a real hidden
// <input type="file" name={name}> in sync (via DataTransfer) so the parent form's
// FormData submit keeps working unchanged.
export function ImageDropzone({ name, initialUrl }: { name: string; initialUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function setFile(file: File | null) {
    if (!file) {
      setPreview(initialUrl ?? null);
      setError("");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (!ACCEPT.includes(file.type)) {
      setError("Unsupported format — use JPG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Too large (${(file.size / 1048576).toFixed(1)} MB) — max 5 MB.`);
      return;
    }
    setError("");
    // Sync into the hidden input so FormData picks it up on submit.
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) inputRef.current.files = dt.files;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files?.[0] ?? null); }}
        style={{ ...s.zone, ...(dragOver ? s.zoneOver : {}), ...(error ? s.zoneError : {}) }}
      >
        {preview ? (
          <img src={preview} alt="preview" style={s.preview} />
        ) : (
          <div style={s.hint}>
            <div style={s.hintIcon}>⬆</div>
            <div><strong>Drag &amp; drop</strong> or click to upload</div>
            <small style={s.hintSub}>JPG / PNG / WebP · max 5 MB</small>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={ACCEPT.join(",")}
        style={{ display: "none" }}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <div style={s.footer}>
        {preview && (
          <button type="button" onClick={() => setFile(null)} style={s.remove}>
            Remove
          </button>
        )}
        {error && <span style={s.error}>{error}</span>}
      </div>
    </div>
  );
}

const s = {
  zone: {
    border: "2px dashed var(--c-border)",
    borderRadius: "10px",
    background: "var(--c-surface-2)",
    minHeight: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
    transition: "border-color 0.15s, background 0.15s",
  },
  zoneOver: { borderColor: "var(--c-accent)", background: "var(--c-accent-soft)" },
  zoneError: { borderColor: "#fca5a5", background: "#fef2f2" },
  preview: { width: "100%", height: "140px", objectFit: "contain" as const },
  hint: { textAlign: "center" as const, color: "var(--c-muted)", fontSize: "0.875rem", padding: "1rem" },
  hintIcon: { fontSize: "1.5rem", marginBottom: "0.25rem" },
  hintSub: { color: "var(--c-muted)", opacity: 0.8 },
  footer: { display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.4rem", minHeight: "1.2rem" },
  remove: { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8125rem", padding: 0 },
  error: { color: "#dc2626", fontSize: "0.8125rem" },
} as const;
