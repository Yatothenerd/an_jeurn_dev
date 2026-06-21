"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface Props {
  slug: string;
  loadedAt: number; // server-side Date.now() when the page was rendered
}

export function ThemePoller({ slug, loadedAt }: Props) {
  const router   = useRouter();
  const baseline = useRef(loadedAt);

  useEffect(() => {
    const check = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/invite/version?slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const { version } = (await res.json()) as { version: number };
        if (version && version > baseline.current) {
          baseline.current = version;
          router.refresh();
        }
      } catch {
        // non-fatal — skip this poll cycle
      }
    };

    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [slug, router]);

  return null;
}
