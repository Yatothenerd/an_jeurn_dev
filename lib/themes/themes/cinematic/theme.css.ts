// Cinematic: a full-bleed video-background cover. The video sits behind a
// gradient scrim; content renders on top. Sections fall back to the standard
// layout. CSS injected only when this theme is active.

export const CINEMATIC_CSS = `
.cin-cover {
  position: relative; min-height: 90vh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 1rem; padding: 4rem 1.5rem; overflow: hidden; color: #fff;
}
.cin-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
.cin-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.7)); z-index: 1; }
.cin-content { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 0.85rem; width: 100%; }
`;
