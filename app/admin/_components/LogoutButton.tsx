"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} style={s.btn}>
      Sign out
    </button>
  );
}

const s = {
  btn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#aaa",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8125rem",
    width: "100%",
    textAlign: "left" as const,
    marginTop: "auto",
  },
} as const;
