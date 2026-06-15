"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  invitationId: string;
  shareLink: string | null;
  isPublished: boolean;
  showWatermark: boolean;
  hasHosting: boolean;
}

export function SettingsTab({ invitationId, shareLink, isPublished, showWatermark, hasHosting }: Props) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function togglePublish() {
    setError("");
    setToggling(true);
    const res = await fetch(`/api/dashboard/invitation/${invitationId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    setToggling(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to update");
      return;
    }
    router.refresh();
  }

  function copyLink() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={s.page}>
      <h2 style={s.heading}>Settings</h2>

      {/* Share Link */}
      <div style={s.card}>
        <div style={s.cardTitle}>Share Link</div>
        {shareLink ? (
          <div style={s.linkRow}>
            <input readOnly value={shareLink} style={s.linkInput} />
            <button onClick={copyLink} style={s.copyBtn}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        ) : (
          <p style={s.linkNote}>Publish your invitation to generate a share link.</p>
        )}
      </div>

      {/* Publish */}
      <div style={s.card}>
        <div style={s.cardTitle}>Publication</div>
        {!hasHosting ? (
          <div style={s.noHosting}>
            Hosting is not included in your package. Upgrade to publish and share your invitation.
          </div>
        ) : (
          <div style={s.publishRow}>
            <div>
              <div style={s.publishLabel}>{isPublished ? "Published" : "Draft"}</div>
              <div style={s.publishSub}>
                {isPublished
                  ? "Your invitation is live and accessible via the share link."
                  : "Your invitation is private. Publish to make it accessible."}
              </div>
            </div>
            <button
              onClick={togglePublish}
              disabled={toggling}
              style={{ ...s.toggleBtn, ...(isPublished ? s.unpublishBtn : s.publishBtn) }}
            >
              {toggling ? "…" : isPublished ? "Unpublish" : "Publish"}
            </button>
          </div>
        )}
        {error && <p style={s.error}>{error}</p>}
      </div>

      {/* Watermark */}
      <div style={s.card}>
        <div style={s.cardTitle}>Watermark</div>
        <div style={s.watermarkRow}>
          <span style={showWatermark ? s.wmOn : s.wmOff}>
            {showWatermark ? "Watermark visible" : "No watermark"}
          </span>
          <span style={s.wmNote}>
            {showWatermark
              ? "Upgrade to a higher package to remove the Anjeurn watermark."
              : "No watermark on your invitations."}
          </span>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: "560px", display: "flex", flexDirection: "column" as const, gap: "1rem" },
  heading: { margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 600, color: "#0f172a" },
  card: {
    background: "#fff",
    borderRadius: "10px",
    padding: "1.25rem",
    border: "1px solid #e2e8f0",
  },
  cardTitle: { fontSize: "0.8125rem", fontWeight: 600, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.875rem" },
  linkRow: { display: "flex", gap: "0.5rem" },
  linkInput: {
    flex: 1,
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "0.875rem",
    color: "#374151",
    background: "#f8fafc",
    fontFamily: "monospace",
    minWidth: 0,
  },
  copyBtn: {
    padding: "0.5rem 0.875rem",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#374151",
    whiteSpace: "nowrap" as const,
  },
  linkNote: { margin: 0, color: "#94a3b8", fontSize: "0.875rem" },
  noHosting: { padding: "0.75rem", background: "#fef9c3", borderRadius: "8px", fontSize: "0.875rem", color: "#854d0e" },
  publishRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" },
  publishLabel: { fontSize: "0.9375rem", fontWeight: 600, color: "#0f172a" },
  publishSub: { fontSize: "0.8125rem", color: "#64748b", marginTop: "0.125rem" },
  toggleBtn: {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  publishBtn: { background: "#7c3aed", color: "#fff" },
  unpublishBtn: { background: "#f1f5f9", color: "#374151" },
  error: { margin: "0.625rem 0 0", color: "#dc2626", fontSize: "0.875rem" },
  watermarkRow: { display: "flex", flexDirection: "column" as const, gap: "0.25rem" },
  wmOn: { fontSize: "0.875rem", fontWeight: 600, color: "#854d0e" },
  wmOff: { fontSize: "0.875rem", fontWeight: 600, color: "#15803d" },
  wmNote: { fontSize: "0.8125rem", color: "#64748b" },
} as const;
