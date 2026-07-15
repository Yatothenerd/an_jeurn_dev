// Sand Beach — a dusty-blue & warm-sand seaside theme: a fixed sky-to-sand
// gradient behind the whole scroll, lace-scalloped section cards, a satin
// ribbon bow, tilted polaroids, a hearted month calendar with a digital
// counter, and pearl dress-code swatches. Cormorant Garamond display type
// pairs with Kantumruy Pro for body copy (Khmer-safe, matches every theme).

export const SAND_BEACH_CSS = `
/* ── Shell ── */
.invite-shell.sb-invite {
  background: linear-gradient(180deg, #dce8f4 0%, #eef3f8 380px, #f4ede0 100%);
  background-attachment: fixed;
  padding: 14px 10px 7rem;
}
.sb-invite, .sb-invite button, .sb-invite input, .sb-invite textarea {
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
}

/* ── Opening gate re-skin ──
   A two-tone "sky meets sand" card: a wavy blue-to-sand gradient with a
   scattered shell/pearl texture settling in the lower third, echoing the
   reference's wave + sand + oyster-shell teaser card. ── */
body:has(.sb-invite) { background: #eef3f8; }
.inv-gate {
  width: calc(100% - 32px);
  margin: 16px auto;
  height: calc(100vh - 32px);
  height: calc(100svh - 32px);
  border-radius: 22px;
  border: 1px solid #c7d6e6;
  box-shadow: inset 0 0 0 5px #fdfaf3, inset 0 0 0 6px #5b83ab;
  background:
    radial-gradient(circle at 12% 84%, rgba(255,255,255,0.9) 0 3px, transparent 3.5px) 0 0 / 46px 40px,
    radial-gradient(circle at 34% 90%, rgba(255,255,255,0.75) 0 2px, transparent 2.5px) 0 0 / 46px 40px,
    radial-gradient(circle at 60% 80%, rgba(255,255,255,0.6) 0 2.5px, transparent 3px) 0 0 / 46px 40px,
    linear-gradient(180deg, #cfe0f0 0%, #d9e6f2 58%, #ecdfc4 58%, #f3ead8 100%) !important;
  padding: 6.4rem 1.6rem 2.6rem;
  justify-content: center !important;
  gap: 2.2rem;
}
.inv-gate img[alt="Monogram"] {
  width: 104px !important; height: 104px !important;
  border: 3px solid #c7d6e6;
  box-shadow: 0 6px 18px rgba(91,131,171,0.22);
}
.inv-gate .inv-pretitle {
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
  font-weight: 700;
  color: #7fa3cf;
}
.inv-gate .inv-script {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-style: italic;
  font-size: 1.6rem;
  line-height: 1.4;
  color: #3c5a78 !important;
}
.inv-gate .inv-ornament-line { display: none; }
.inv-gate .inv-greeting-label {
  background: #fff;
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
  font-weight: 700;
  opacity: 1;
}
.inv-gate .inv-gate-name {
  display: block;
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif !important;
  font-style: italic;
  font-size: 0.92rem !important;
  border: 1px solid rgba(91,131,171,0.3);
  border-radius: 12px;
  background: rgba(91,131,171,0.04);
  padding: 0.7rem 1.2rem;
  max-width: 300px;
  margin: 0 auto;
}
.inv-gate-open-label {
  background: #5b83ab !important;
  color: #fff !important;
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
  font-weight: 700;
  padding: 0.75rem 2rem !important;
}

/* ── Section cards: scalloped lace top edge over a soft white card ── */
.sb-section {
  position: relative;
  background: rgba(253, 250, 243, 0.72);
  margin: 0 0.35rem 0.9rem;
  border-radius: 18px;
  padding: 2.1rem 1.5rem 1.7rem;
  box-shadow: 0 8px 26px rgba(91,131,171,0.12);
  overflow: hidden;
}
.sb-section::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; height: 14px;
  background-image: radial-gradient(circle at 10px 0, transparent 9px, #fdfaf3 9.5px);
  background-size: 20px 14px;
  background-repeat: repeat-x;
}
.sb-section::after {
  content: "";
  position: absolute;
  bottom: 0; left: 0; right: 0; height: 14px;
  background-image: radial-gradient(circle at 10px 14px, transparent 9px, #fdfaf3 9.5px);
  background-size: 20px 14px;
  background-repeat: repeat-x;
}
.sb-section.sb-first { border-radius: 22px 22px 18px 18px; }
.sb-section.sb-last  { border-radius: 18px 18px 22px 22px; padding-bottom: 2.6rem; }

/* ── Typography ── */
.sb-body {
  font-size: 1rem;
  line-height: 1.65;
  color: #3c5a78;
  text-align: center;
  margin: 0.4rem 0;
}
.sb-small {
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9aa9b8;
  text-align: center;
  margin: 0.15rem 0;
}

/* ── Section head: dashed divider + shells, then script heading + caption ── */
.sb-divider { display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin: 0 0 1.1rem; }
.sb-divider .line {
  flex: 1; max-width: 60px; height: 0;
  border-top: 1px dashed rgba(91,131,171,0.4);
}
.sb-divider .tag {
  font-size: 0.64rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  color: #5b83ab; white-space: nowrap;
}
.sb-head { text-align: center; margin-bottom: 1.3rem; }
.sb-head h3 {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-weight: 600;
  font-style: italic;
  font-size: 1.7rem;
  line-height: 1.3;
  color: #3c5a78;
  margin: 0 0 0.15rem;
}
.sb-head .cap {
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: #9aa9b8;
  margin: 0 0 0.7rem;
}
.sb-wave { display: block; width: 76px; height: auto; margin: 0.6rem auto 0; opacity: 0.85; }

/* ── Ribbon banner tag (ornate pennant caption) ── */
.sb-banner {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
  background: #5b83ab;
  color: #fdfaf3;
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 0.45rem 1.4rem;
  margin: 0 0 0.7rem;
  clip-path: polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%, 8% 50%);
  box-shadow: 0 3px 10px rgba(91,131,171,0.3);
}
.sb-banner-fold {
  position: absolute; top: 50%; width: 7px; height: 7px;
  background: rgba(0,0,0,0.16); border-radius: 1px;
  transform: translateY(-50%) rotate(45deg);
}
.sb-banner-fold.left { left: -2px; }
.sb-banner-fold.right { right: -2px; }

/* ── Cover ── */
.sb-cover { position: relative; text-align: center; padding-top: 0.2rem; }
.sb-cover-scatter { position: absolute; top: -0.6rem; right: -0.4rem; width: 56px; opacity: 0.55; transform: rotate(6deg); }
.sb-big {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-weight: 600;
  font-size: 2.1rem;
  line-height: 1.25;
  color: #3c5a78;
  margin: 0 0 1rem;
}
.sb-bow { height: auto; margin: 0 auto 0.3rem; display: block; }
.sb-cover-bow { margin: 0.4rem auto 0.6rem; }
.sb-guestpill {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: #fff; border: 1px solid rgba(91,131,171,0.3);
  color: #5b83ab; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 0.35rem 0.9rem; border-radius: 999px;
  margin: 0.7rem 0 0.6rem;
}
.sb-guestbox {
  display: block; max-width: 300px; margin: 0 auto 1.1rem;
  border: 1px solid rgba(91,131,171,0.3); border-radius: 12px;
  background: rgba(91,131,171,0.04);
  padding: 0.7rem 1.2rem;
  font-style: italic; color: #9aa9b8; font-size: 0.92rem;
}
.sb-guestbox.has-name { font-style: normal; color: #3c5a78; font-weight: 600; }
.sb-names {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-weight: 600;
  font-size: 1.55rem;
  line-height: 1.35;
  color: #3c5a78;
  text-align: center;
  margin: 0.7rem 0 0.3rem;
}
.sb-date { margin-top: 0.6rem; }

/* ── Polaroid photo (cover / wording / gallery) ── */
.sb-polaroid-wrap { width: 190px; max-width: 62%; margin: 0.4rem auto 0.8rem; }
.sb-small-polaroid { width: 160px; }
.sb-polaroid {
  background: #fff; padding: 8px 8px 22px; border-radius: 3px;
  box-shadow: 0 8px 20px rgba(91,131,171,0.22);
  transform: rotate(-2deg);
}
.sb-polaroid img { width: 100%; aspect-ratio: 1 / 1.05; object-fit: cover; display: block; border-radius: 2px; }

/* ── Calendar (countdown) ── */
.sb-cal {
  max-width: 320px; margin: 0.6rem auto 0;
  background: #fff; border-radius: 14px; padding: 1rem 0.9rem;
  box-shadow: 0 4px 16px rgba(91,131,171,0.12);
}
.sb-cal-month {
  display: flex; justify-content: center; align-items: baseline; gap: 0.4rem;
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: 1.1rem; color: #3c5a78; margin-bottom: 0.6rem;
}
.sb-cal-month b { font-weight: 600; }
.sb-cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.2rem;
  text-align: center;
}
.sb-cal-dow { font-size: 0.56rem; font-weight: 700; color: #9aa9b8; padding-bottom: 0.3rem; }
.sb-cal-day {
  position: relative; font-size: 0.82rem; color: #3c5a78; padding: 0.35rem 0;
  display: flex; align-items: center; justify-content: center;
}
.sb-cal-day.on { font-weight: 700; color: #fff; background: #d88a95; border-radius: 50%; }
.sb-cal-count { text-align: center; font-size: 0.85rem; color: #7fa3cf; margin-top: 0.8rem; }

/* ── Digital countdown boxes ── */
.sb-digits {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;
  max-width: 320px; margin: 0.9rem auto 0;
}
.sb-digit {
  display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
  background: #fff; border-radius: 12px; padding: 0.7rem 0.2rem;
  box-shadow: 0 4px 14px rgba(91,131,171,0.14);
}
.sb-digit .n { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: #3c5a78; line-height: 1; }
.sb-digit .l { font-size: 0.56rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9aa9b8; margin-top: 0.3rem; }

/* ── Details / venue ── */
.sb-venue-photo {
  border-radius: 14px; overflow: hidden; border: 4px solid #fff;
  box-shadow: 0 8px 22px rgba(91,131,171,0.2);
  margin: 0 0 0.6rem;
}
.sb-venue-photo img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; }
.sb-detail-label {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: #9aa9b8; margin: 1rem 0 0.2rem; text-align: center;
}
.sb-detail-value { font-size: 1.02rem; font-weight: 600; color: #3c5a78; margin: 0 0 0.15rem; text-align: center; }
.sb-btn {
  display: inline-block; margin-top: 0.5rem;
  border: 1px solid #5b83ab; color: #5b83ab; background: #fff;
  font-size: 0.85rem; font-weight: 600; letter-spacing: 0.06em;
  padding: 0.5rem 1.4rem; border-radius: 999px; text-decoration: none; cursor: pointer;
}

/* ── Dress code pearls ── */
.sb-dress-block { margin-top: 1.5rem; text-align: center; }
.sb-pearls { display: flex; gap: 0.55rem; justify-content: center; align-items: center; flex-wrap: wrap; margin-top: 0.5rem; }
.sb-pearl {
  width: 24px; height: 24px; border-radius: 50%; display: inline-block;
  background-blend-mode: overlay;
  box-shadow: 0 2px 6px rgba(60,90,120,0.25), inset -3px -3px 5px rgba(0,0,0,0.12), inset 3px 3px 5px rgba(255,255,255,0.7);
  border: 2px solid #fff;
}

/* ── Celebration notes ── */
.sb-notes { margin-top: 1.5rem; }
.sb-note-card {
  display: flex; align-items: flex-start; gap: 0.6rem;
  background: rgba(91,131,171,0.05); border: 1px solid rgba(91,131,171,0.15);
  border-radius: 12px; padding: 0.7rem 0.9rem; margin-bottom: 0.5rem;
}
.sb-note-card .num {
  flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
  background: #5b83ab; color: #fff; font-size: 0.7rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.sb-note-card p { margin: 0; font-size: 0.88rem; color: #3c5a78; line-height: 1.5; text-align: left; }

/* ── Agenda ── */
.sb-agenda { margin-top: 0.4rem; }
.sb-agenda-row {
  display: flex; align-items: center; gap: 0.8rem;
  padding: 0.65rem 0; border-bottom: 1px dashed rgba(91,131,171,0.25);
}
.sb-agenda-time { flex-shrink: 0; width: 62px; font-size: 0.9rem; font-weight: 700; color: #3c5a78; }
.sb-agenda-dot { flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; background: #7fa3cf; }
.sb-agenda-activity { flex: 1; font-size: 0.92rem; color: #3c5a78; }
.sb-note {
  margin-top: 1rem; padding: 0.8rem 1rem; border-radius: 10px;
  background: rgba(91,131,171,0.05); border: 1px dashed rgba(91,131,171,0.25);
  font-size: 0.82rem; font-style: italic; color: #7fa3cf; text-align: center; line-height: 1.5;
}

/* ── Polaroid gallery ── */
.sb-polaroids {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem 0.7rem;
  margin: 0.6rem 0.4rem 0;
}
.sb-gallery-polaroid { cursor: zoom-in; padding-bottom: 14px; }
.sb-gallery-polaroid img { aspect-ratio: 1 / 1; }
.sb-gallery-polaroid:nth-child(4n+1) { transform: rotate(-3deg); }
.sb-gallery-polaroid:nth-child(4n+2) { transform: rotate(2.5deg); margin-top: 0.6rem; }
.sb-gallery-polaroid:nth-child(4n+3) { transform: rotate(2deg); }
.sb-gallery-polaroid:nth-child(4n+4) { transform: rotate(-2.5deg); margin-top: 0.6rem; }

/* ── KHQR ── */
.sb-qr {
  display: block; width: 55%; max-width: 170px; margin: 0.6rem auto 0;
  border: 1px solid rgba(91,131,171,0.25); border-radius: 10px; background: #fff; padding: 10px;
}

/* ── Wishing ── */
.sb-wish-input {
  width: 100%; border: 1px solid rgba(91,131,171,0.3); border-radius: 999px;
  background: #fff; color: #3c5a78; font-size: 0.95rem; padding: 0.6rem 1.1rem;
}
.sb-wish-input::placeholder { color: #b7c3d0; }
.sb-wish-send {
  border: none; border-radius: 999px; background: #5b83ab; color: #fff;
  font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em; padding: 0.6rem 1rem; cursor: pointer;
}
.sb-wish-card {
  border: 1px solid rgba(91,131,171,0.18); border-radius: 12px; background: #fff;
  padding: 0.8rem 1rem; margin-bottom: 0.7rem;
}
.sb-wish-msg { margin: 0 0 0.3rem; font-size: 0.95rem; color: #3c5a78; line-height: 1.5; font-style: italic; }
.sb-wish-from { margin: 0; font-size: 0.82rem; font-weight: 700; color: #5b83ab; }

/* ── Footer ── */
.sb-foot { text-align: center; padding-bottom: 3rem; }
.sb-foot .sb-bow { margin-top: 1.2rem; }
.sb-foot-emoji { font-size: 1.5rem; letter-spacing: 0.4rem; margin: 0 0 0.9rem; }

/* ── Pearl scatter (decorative corner accent) ── */
.sb-pearl-scatter { display: block; width: 100%; height: auto; }
`;
