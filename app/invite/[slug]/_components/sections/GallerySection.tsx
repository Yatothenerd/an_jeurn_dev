"use client";

import { useState } from "react";
import Image from "next/image";
import type { ThemeTokens } from "@/lib/themes/types";

interface Photo {
  id: string;
  url: string;
  sortOrder: number;
}

interface Props {
  content: { layout?: string; title?: string };
  photos: Photo[];
  theme: ThemeTokens;
}

export function GallerySection({ content, photos, theme }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const layout = content.layout ?? "grid";

  if (photos.length === 0) return null;

  const lightboxNode = lightbox && (
    <div style={s.lightboxBg} onClick={() => setLightbox(null)}>
      <Image
        src={lightbox}
        alt=""
        width={800}
        height={600}
        style={s.lightboxImg}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );

  if (layout === "slideshow") {
    return (
      <section className="inv-section" style={{ fontFamily: theme.font }}>
        <div className="inv-section-title" style={{ color: theme.primary }}>
          <div className="line" /><span>{content.title || "Gallery"}</span><div className="line" />
        </div>
        <Slideshow photos={photos} theme={theme} />
        {lightboxNode}
      </section>
    );
  }

  return (
    <section className="inv-section" style={{ fontFamily: theme.font }}>
      <div className="inv-section-title" style={{ color: theme.primary }}>
        <div className="line" /><span>{content.title || "Gallery"}</span><div className="line" />
      </div>
      <div className={`inv-photos${layout === "masonry" ? " masonry" : ""}`}>
        {photos.map((p) => (
          <button key={p.id} className="inv-photo" onClick={() => setLightbox(p.url)}>
            <Image src={p.url} alt="" width={200} height={200} sizes="(max-width: 480px) 33vw, 160px" style={s.img} />
          </button>
        ))}
      </div>
      {lightboxNode}
    </section>
  );
}

function Slideshow({ photos, theme }: { photos: Photo[]; theme: ThemeTokens }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div style={s.slideshow}>
      <Image src={photos[idx].url} alt="" width={480} height={320} style={s.slide} sizes="(max-width: 480px) 100vw, 480px" />
      <div style={s.slideControls}>
        <button onClick={prev} style={{ ...s.slideBtn, color: theme.accent }}>←</button>
        <span style={{ color: theme.accent, fontSize: "0.8125rem" }}>{idx + 1} / {photos.length}</span>
        <button onClick={next} style={{ ...s.slideBtn, color: theme.accent }}>→</button>
      </div>
    </div>
  );
}

const s = {
  img: { width: "100%", height: "100%", objectFit: "cover" as const, display: "block" },
  lightboxBg: {
    position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", cursor: "zoom-out",
  },
  lightboxImg: { maxWidth: "100%", maxHeight: "90vh", objectFit: "contain" as const, borderRadius: "8px", cursor: "default" },
  slideshow: { maxWidth: "480px", margin: "0 auto" },
  slide: { width: "100%", height: "auto", objectFit: "cover" as const, borderRadius: "12px", display: "block" },
  slideControls: { display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "0.75rem" },
  slideBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", padding: "0.5rem" },
} as const;
