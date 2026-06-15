"use client";

import { useState } from "react";
import Image from "next/image";

interface Photo {
  id: string;
  url: string;
  sortOrder: number;
}

interface Props {
  content: { layout?: string };
  photos: Photo[];
  theme: { primary: string; accent: string; bg: string; cardBg: string; border: string; font: string };
}

export function GallerySection({ content, photos, theme }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const layout = content.layout ?? "grid";

  if (photos.length === 0) return null;

  return (
    <section style={{ ...s.section, fontFamily: theme.font }}>
      <h2 style={{ ...s.heading, color: theme.primary }}>Gallery</h2>

      {layout === "slideshow" ? (
        <Slideshow photos={photos} theme={theme} />
      ) : (
        <div style={{ ...s.grid, gridTemplateColumns: layout === "masonry" ? "repeat(2, 1fr)" : "repeat(3, 1fr)" }}>
          {photos.map((p) => (
            <button key={p.id} onClick={() => setLightbox(p.url)} style={s.thumb}>
              <Image
                src={p.url}
                alt=""
                width={200}
                height={200}
                style={s.img}
                sizes="(max-width: 480px) 33vw, 160px"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
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
      )}
    </section>
  );
}

function Slideshow({ photos, theme }: { photos: Photo[]; theme: Props["theme"] }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div style={s.slideshow}>
      <Image
        src={photos[idx].url}
        alt=""
        width={480}
        height={320}
        style={s.slide}
        sizes="(max-width: 480px) 100vw, 480px"
      />
      <div style={s.slideControls}>
        <button onClick={prev} style={{ ...s.slideBtn, color: theme.accent }}>←</button>
        <span style={{ color: theme.accent, fontSize: "0.8125rem" }}>{idx + 1} / {photos.length}</span>
        <button onClick={next} style={{ ...s.slideBtn, color: theme.accent }}>→</button>
      </div>
    </div>
  );
}

const s = {
  section: { padding: "3rem 1.5rem" },
  heading: { margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 400, textAlign: "center" as const },
  grid: { display: "grid", gap: "0.375rem", maxWidth: "480px", margin: "0 auto" },
  thumb: { background: "none", border: "none", padding: 0, cursor: "pointer", borderRadius: "6px", overflow: "hidden", aspectRatio: "1", display: "block" },
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
