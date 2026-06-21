"use client";

import { useState } from "react";

interface Props {
  shareLink: string;
  isPublished: boolean;
}

export function ShareLinkCopy({ shareLink, isPublished }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the input text
      const el = document.getElementById("share-link-input") as HTMLInputElement | null;
      el?.select();
    }
  }

  return (
    <div style={s.wrap}>
      {!isPublished && (
        <p style={s.draftNote}>This link will become active once your administrator publishes the invitation.</p>
      )}
      <div style={s.row}>
        <input
          id="share-link-input"
          readOnly
          value={shareLink}
          style={s.input}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button onClick={copy} style={s.copyBtn}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  draftNote: { margin: 0, fontSize: "0.8rem", color: "#f59e0b", fontStyle: "italic" },
  row: { display: "flex", gap: "0.5rem" },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--c-border)",
    borderRadius: "7px",
    background: "var(--c-surface-2)",
    color: "var(--c-muted)",
    fontSize: "0.8rem",
    fontFamily: "monospace",
  },
  copyBtn: {
    padding: "0.5rem 0.875rem",
    background: "var(--c-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
} as const;
