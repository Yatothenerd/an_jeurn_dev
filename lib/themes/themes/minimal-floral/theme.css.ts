// Minimal Floral — cream paper column on a warm taupe page, elegant serif
// display type, uppercase tracked labels, a hand-circled calendar, a
// floral-beaded timeline, and minimal line-art blossoms throughout.

export const MF_CSS = `
/* ── Shell ── */
.invite-shell.mf-invite {
  background: linear-gradient(180deg, #ab9a86 0%, #96856f 100%);
  padding: 14px 12px 7rem;
}
.mf-invite, .mf-invite button, .mf-invite input {
  font-family: 'Cormorant Garamond', 'Kantumruy Pro', serif;
}

/* ── Paper column ── */
.mf-section {
  background: #faf6ee;
  padding: 2.6rem 1.5rem;
  position: relative;
  overflow: hidden;
}
.mf-section.mf-first { border-radius: 6px 6px 0 0; }
.mf-section.mf-last  { border-radius: 0 0 6px 6px; }

/* ── Typography ── */
.mf-title {
  font-family: 'Jost', 'Kantumruy Pro', sans-serif;
  font-weight: 500;
  font-size: 1.05rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  line-height: 1.3;
  color: #8a6d47;
  text-align: center;
  margin: 0 0 0.5rem;
}
.mf-body {
  font-size: 1.12rem;
  font-weight: 400;
  line-height: 1.55;
  color: #6b5c47;
  text-align: center;
  margin: 0.35rem 0;
}
.mf-small {
  font-family: 'Jost', 'Kantumruy Pro', sans-serif;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  color: #a5937a;
  text-align: center;
  margin: 0.2rem 0;
}
.mf-center { text-align: center; }

/* ── Cover ── */
.mf-cover { text-align: center; padding-top: 0.2rem; }
.mf-cover-floral { display: block; width: 84%; max-width: 300px; margin: 0 auto 0.6rem; }
.mf-pretitle {
  font-family: 'Jost', 'Kantumruy Pro', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #9c7b4f;
  margin: 0.4rem 0 0;
}
.mf-names {
  font-family: 'Cormorant Garamond', 'Kantumruy Pro', serif;
  font-style: italic;
  font-weight: 500;
  font-size: 2.9rem;
  line-height: 1.15;
  color: #5b4630;
  margin: 0.5rem 0 0.6rem;
}
.mf-rule { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 0.2rem auto 0.7rem; max-width: 220px; }
.mf-rule .line { flex: 1; height: 1px; background: #c9b491; }
.mf-meta {
  font-size: 1.02rem;
  color: #8a765c;
  text-align: center;
  margin: 0.1rem 0;
}
.mf-guest {
  display: inline-block;
  border: 1px dashed #c9a25a;
  color: #8a6d47;
  font-size: 1.08rem;
  font-style: italic;
  padding: 0.3rem 1.4rem;
  border-radius: 999px;
  margin-top: 1rem;
}

/* ── Divider ── */
.mf-divider { display: block; width: 130px; margin: 0.4rem auto 1rem; }

/* ── Plain photo (wording / details) ── */
.mf-photo {
  display: block;
  width: 100%;
  border-radius: 4px;
  margin: 1rem 0;
  box-shadow: 0 6px 18px rgba(91, 70, 48, 0.16);
}

/* ── Calendar ── */
.mf-cal { max-width: 260px; margin: 0.5rem auto 0; }
.mf-cal-month {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  font-family: 'Jost', 'Kantumruy Pro', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b5c47;
  margin-bottom: 0.6rem;
}
.mf-cal-month b { color: #8a6d47; font-weight: 600; }
.mf-cal-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  font-family: 'Jost', 'Kantumruy Pro', sans-serif;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  color: #a5937a;
  text-align: center;
  margin-bottom: 0.3rem;
}
.mf-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 0.35rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b5c47;
  text-align: center;
}
.mf-cal-day { position: relative; padding: 0.22rem 0; }
.mf-cal-day.on { color: #8a6d47; font-weight: 700; }
.mf-cal-day.on::after {
  content: "";
  position: absolute;
  left: 50%; top: 50%;
  width: 28px; height: 24px;
  transform: translate(-50%, -50%) rotate(-6deg);
  border: 1.5px solid #9c7b4f;
  border-radius: 50%;
}

/* ── Live countdown ── */
.mf-count {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  max-width: 300px;
  margin: 1.3rem auto 0;
}
.mf-count-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.6rem 0.2rem;
  background: #fffdf9;
  border: 1px solid rgba(139, 109, 71, 0.22);
  border-radius: 4px;
}
.mf-count-cell .num {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 1.5rem;
  color: #5b4630;
  line-height: 1;
}
.mf-count-cell .lbl {
  font-family: 'Jost', 'Kantumruy Pro', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #a5937a;
  margin-top: 0.15rem;
}

/* ── Timeline (agenda) ── */
.mf-tl { position: relative; padding: 0.3rem 0.6rem 0.3rem 1.6rem; max-width: 320px; margin: 0 auto; }
.mf-tl::before {
  content: "";
  position: absolute;
  left: 12px; top: 6px; bottom: 6px;
  width: 1px;
  background: repeating-linear-gradient(180deg, #c9b491 0 6px, transparent 6px 11px);
}
.mf-tl-row { position: relative; display: flex; align-items: flex-start; gap: 0.9rem; padding: 0.6rem 0 0.6rem; }
.mf-tl-marker {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: #faf6ee;
  border: 1px solid #c9b491;
  border-radius: 50%;
  margin-left: -14px;
}
.mf-tl-body { text-align: left; padding-top: 0.05rem; }
.mf-tl-time {
  font-family: 'Jost', 'Kantumruy Pro', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #8a6d47;
  margin: 0;
}
.mf-tl-name {
  font-size: 1.05rem;
  font-weight: 400;
  color: #6b5c47;
  line-height: 1.3;
  margin: 0.15rem 0 0;
}

/* ── Buttons ── */
.mf-btn {
  display: inline-block;
  background: #5b4630;
  color: #faf6ee;
  font-family: 'Jost', 'Kantumruy Pro', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0.65rem 1.9rem;
  border-radius: 999px;
  text-decoration: none;
  cursor: pointer;
}

.mf-block { margin-top: 1.7rem; }

/* Dress-code birds */
.mf-dress {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin: 0.9rem 0 0.2rem;
}
.mf-dress svg:nth-child(odd)  { transform: rotate(-6deg); }
.mf-dress svg:nth-child(even) { transform: rotate(5deg); }

/* Notes */
.mf-notes { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem; }
.mf-note {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  justify-content: center;
  border-top: 1px solid rgba(139, 109, 71, 0.18);
  border-bottom: 1px solid rgba(139, 109, 71, 0.18);
  padding: 0.7rem 0.5rem;
  font-size: 1rem;
  color: #6b5c47;
  text-align: center;
  line-height: 1.35;
}

/* ── Gallery ── */
.mf-gallery {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 0.6rem;
}
.mf-galitem { border-radius: 4px; overflow: hidden; }
.mf-galitem img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
.mf-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(60, 48, 32, 0.88);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  cursor: zoom-out;
}
.mf-lightbox img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
  cursor: default;
}

/* ── KHQR ── */
.mf-qr {
  display: block;
  width: 55%;
  max-width: 170px;
  margin: 0.6rem auto 0;
  border: 1px solid rgba(139, 109, 71, 0.25);
  border-radius: 6px;
  background: #fff;
  padding: 8px;
}

/* ── Wishing ── */
.mf-wish-input {
  width: 100%;
  border: 1px solid rgba(139, 109, 71, 0.3);
  border-radius: 999px;
  background: #fffdf9;
  color: #6b5c47;
  font-size: 1.02rem;
  padding: 0.55rem 1.1rem;
}
.mf-wish-input::placeholder { color: #b6a68d; }
.mf-wish-send {
  border: none;
  border-radius: 999px;
  background: #5b4630;
  color: #faf6ee;
  font-family: 'Jost', 'Kantumruy Pro', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.6rem 1rem;
  cursor: pointer;
}
.mf-wish-card {
  border: 1px solid rgba(139, 109, 71, 0.2);
  border-radius: 10px;
  background: #fffdf9;
  padding: 0.8rem 1rem;
  margin-bottom: 0.7rem;
}
.mf-wish-msg { margin: 0 0 0.3rem; font-size: 1.05rem; color: #6b5c47; line-height: 1.35; }
.mf-wish-from { margin: 0; font-size: 0.9rem; font-weight: 600; color: #8a6d47; }

/* ── Footer ── */
.mf-foot { text-align: center; padding-bottom: 3rem; }
.mf-foot-floral { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-bottom: 0.7rem; }
`;
