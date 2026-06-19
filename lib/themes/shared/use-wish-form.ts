"use client";

import { useState } from "react";
import type { InviteWish } from "@/lib/utils/invite-cache";

/** Shared guest-book form state + submit, used by every theme's wishing section. */
export function useWishForm(invitationId: string, initialWishes: InviteWish[]) {
  const [wishes, setWishes] = useState<InviteWish[]>(initialWishes);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, guestName: name.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to submit wish");
        return;
      }
      const { data } = await res.json();
      setWishes((w) => [{ ...data, createdAt: data.createdAt ?? new Date().toISOString() }, ...w]);
      setName("");
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    wishes,
    name,
    setName,
    message,
    setMessage,
    submitting,
    submitted,
    error,
    handleSubmit,
  };
}
