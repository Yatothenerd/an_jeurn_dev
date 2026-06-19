// Starlight: an animated night-sky theme. Twinkling cover starfield + scroll
// reveal on each section. Honors prefers-reduced-motion.

export const STARLIGHT_CSS = `
@keyframes sl-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
@keyframes sl-fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }

.sl-cover {
  position: relative; min-height: 88vh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 1rem; padding: 4rem 1.5rem; overflow: hidden;
  background: radial-gradient(circle at 50% 28%, #1b2547 0%, #0a0e1a 72%);
}
.sl-star { position: absolute; border-radius: 50%; background: #fff; box-shadow: 0 0 4px #fff; animation: sl-twinkle 3s infinite ease-in-out; pointer-events: none; }

.sl-reveal { opacity: 0; will-change: opacity, transform; }
.sl-reveal.is-visible { animation: sl-fade-up 0.8s ease forwards; }

@media (prefers-reduced-motion: reduce) {
  .sl-star { animation: none; }
  .sl-reveal, .sl-reveal.is-visible { opacity: 1; animation: none; }
}
`;
