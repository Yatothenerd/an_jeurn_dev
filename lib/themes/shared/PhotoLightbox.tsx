"use client";

// Full-screen tap-to-zoom photo overlay, shared by every theme's gallery
// (each theme keeps its own `useState<string | null>` and just renders this
// when a photo is selected). `overlayColor` preserves each theme's original
// backdrop tint.
export function PhotoLightbox({ url, onClose, overlayColor = "rgba(0, 0, 0, 0.9)" }: {
  url: string;
  onClose: () => void;
  overlayColor?: string;
}) {
  return (
    <div style={{ ...lightboxBg, background: overlayColor }} onClick={onClose}>
      <img src={url} alt="" style={lightboxImg} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

const lightboxBg: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", cursor: "zoom-out",
};
const lightboxImg: React.CSSProperties = {
  maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px", cursor: "default",
};
