// Royal Ticket — a deep-navy boarding-pass / passport travel theme: white
// ticket-stub cards notched like a real boarding pass, a gold dashed
// perforation line, plane + globe glyphs, and passport-stamp ornaments.
// Photos are color by default; black & white is an opt-in per-section toggle
// (content.grayscale, set in the admin content editor). Cormorant Garamond
// display type pairs with Kantumruy Pro for body copy (Khmer-safe, matches
// every theme).

export const ROYAL_TICKET_CSS = `
/* ── Shell ── */
.invite-shell.rt-invite {
  background: linear-gradient(180deg, #0d1730 0%, #16264a 50%, #0d1730 100%);
  background-attachment: fixed;
  padding: 14px 10px 7rem;
}
.rt-invite, .rt-invite button, .rt-invite input, .rt-invite textarea {
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
}

/* ── Opening gate re-skin ── */
body:has(.rt-invite) { background: #0d1730; }
.inv-gate {
  width: calc(100% - 32px);
  margin: 16px auto;
  height: calc(100vh - 32px);
  height: calc(100svh - 32px);
  border-radius: 18px;
  border: 1px solid #c8a15c;
  box-shadow: inset 0 0 0 5px #12213f, inset 0 0 0 6px #c8a15c;
  background: #12213f !important;
  padding: 6.4rem 1.6rem 2.6rem;
  justify-content: center !important;
  gap: 2.2rem;
}
.inv-gate img[alt="Monogram"] {
  width: 104px !important; height: 104px !important;
  border: 3px solid #c8a15c;
  box-shadow: 0 6px 18px rgba(0,0,0,0.4);
}
.inv-gate .inv-pretitle {
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #c8a15c;
}
.inv-gate .inv-script {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: 1.6rem;
  line-height: 1.4;
  color: #f2ecdc !important;
}
.inv-gate .inv-ornament-line { display: none; }
.inv-gate .inv-greeting-label {
  background: rgba(200,161,92,0.12);
  color: #f2ecdc;
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
  font-weight: 700;
  opacity: 1;
}
.inv-gate .inv-gate-name {
  display: block;
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif !important;
  font-style: italic;
  font-size: 0.92rem !important;
  color: #f2ecdc;
  border: 1px solid rgba(200,161,92,0.4);
  border-radius: 10px;
  background: rgba(200,161,92,0.08);
  padding: 0.7rem 1.2rem;
  max-width: 300px;
  margin: 0 auto;
}
.inv-gate-open-label {
  background: #c8a15c !important;
  color: #12213f !important;
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
  font-weight: 700;
  padding: 0.75rem 2rem !important;
}

/* ── Ticket-stub section cards ──
   White rounded card floating over the navy shell, with a gold dashed
   perforation line and two notch "punches" cut from the left/right edges —
   the classic boarding-pass silhouette. Notch fill approximates the shell's
   navy so it reads as a cut-out against the fixed gradient behind it. ── */
.rt-section {
  position: relative;
  background: #ffffff;
  margin: 0 0.35rem 1.1rem;
  border-radius: 16px;
  padding: 2.2rem 1.5rem 1.8rem;
  box-shadow: 0 14px 34px rgba(0,0,0,0.35);
  overflow: visible;
}
.rt-section::before {
  content: "";
  position: absolute;
  left: -9px; top: 84px; width: 18px; height: 18px;
  background: #16264a; border-radius: 50%;
}
.rt-section::after {
  content: "";
  position: absolute;
  right: -9px; top: 84px; width: 18px; height: 18px;
  background: #16264a; border-radius: 50%;
}
.rt-perf {
  position: absolute; left: 20px; right: 20px; top: 84px;
  border-top: 1.5px dashed rgba(18,33,63,0.25);
  pointer-events: none;
}
.rt-section.rt-first { border-radius: 20px 20px 16px 16px; }
.rt-section.rt-last  { border-radius: 16px 16px 20px 20px; padding-bottom: 2.6rem; }

/* ── Typography ── */
.rt-body {
  font-size: 1rem;
  line-height: 1.65;
  color: #3a4258;
  text-align: center;
  margin: 0.4rem 0;
}
.rt-small {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8b93a8;
  text-align: center;
}

/* ── Ticket-stub label divider ── */
.rt-divider { display: flex; align-items: center; justify-content: center; gap: 0.6rem; margin: 0 0 1.3rem; }
.rt-divider .tag {
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  color: #12213f; white-space: nowrap;
}
.rt-plane-flip { transform: scaleX(-1); }

/* ── Section head ── */
.rt-head { text-align: center; margin-bottom: 1.3rem; }
.rt-head .cap {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: #c8a15c; margin: 0 0 0.2rem;
}
.rt-head h3 {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-weight: 600;
  font-size: 1.6rem;
  line-height: 1.3;
  color: #12213f;
  margin: 0 0 0.5rem;
}
.rt-head .rule { width: 40px; height: 1px; background: #c8a15c; margin: 0 auto; }

/* ── Cover / boarding pass ── */
.rt-cover { text-align: center; padding-top: 0.6rem; }
.rt-stub-label {
  font-size: 0.6rem; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase;
  color: #8b93a8; margin: 0.4rem 0;
}
.rt-big {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-weight: 600;
  font-size: 1.9rem;
  line-height: 1.25;
  color: #12213f;
  margin: 0.6rem 0 1.2rem;
}
.rt-data-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;
  border-top: 1px solid rgba(18,33,63,0.12);
  border-bottom: 1px solid rgba(18,33,63,0.12);
  padding: 0.9rem 0; margin: 0.6rem 0;
}
.rt-data-row { display: flex; flex-direction: column; gap: 0.2rem; text-align: left; padding: 0 0.4rem; }
.rt-data-row .l { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #8b93a8; }
.rt-data-row .v { font-size: 0.92rem; font-weight: 600; color: #12213f; }
.rt-guestbox {
  display: flex; flex-direction: column; gap: 0.2rem; text-align: center;
  border: 1px dashed rgba(200,161,92,0.5); border-radius: 10px;
  padding: 0.7rem 1rem; margin: 0.8rem 0;
}
.rt-guestbox .l { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #c8a15c; }
.rt-guestbox .v { font-size: 1rem; font-weight: 600; color: #12213f; margin-top: 0.15rem; }

/* ── Ticket photos — color by default; .rt-photo-mono/.rt-gallery-mono are
   opt-in (content.grayscale, toggled in the admin content editor) ── */
.rt-photo {
  border-radius: 10px; overflow: hidden;
  margin: 0 0 1rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.18);
}
.rt-photo img { width: 100%; aspect-ratio: 16 / 11; object-fit: cover; display: block; }
.rt-photo-mono img { filter: grayscale(1) contrast(1.05); }
.rt-names {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-weight: 600;
  font-size: 1.4rem;
  color: #12213f;
  text-align: center;
  margin: 0.3rem 0 0.5rem;
}

/* ── Calendar (countdown) ── */
.rt-cal {
  max-width: 320px; margin: 0.6rem auto 0;
  background: #f6f4ee; border-radius: 12px; padding: 1rem 0.9rem;
  border: 1px solid rgba(18,33,63,0.08);
}
.rt-cal-month {
  display: flex; justify-content: center; align-items: baseline; gap: 0.4rem;
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: 1.1rem; color: #12213f; margin-bottom: 0.6rem;
}
.rt-cal-month b { font-weight: 600; }
.rt-cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.2rem;
  text-align: center;
}
.rt-cal-dow { font-size: 0.54rem; font-weight: 700; color: #8b93a8; padding-bottom: 0.3rem; }
.rt-cal-day {
  font-size: 0.82rem; color: #12213f; padding: 0.35rem 0;
  display: flex; align-items: center; justify-content: center;
}
.rt-cal-day.on { font-weight: 700; color: #fff; background: #c8a15c; border-radius: 50%; }
.rt-cal-count { text-align: center; font-size: 0.85rem; color: #c8a15c; margin-top: 0.8rem; }

/* ── Digital countdown boxes ── */
.rt-digits {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;
  max-width: 320px; margin: 0.9rem auto 0;
}
.rt-digit {
  display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
  background: #12213f; border-radius: 10px; padding: 0.7rem 0.2rem;
}
.rt-digit .n { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: #c8a15c; line-height: 1; }
.rt-digit .l { font-size: 0.54rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #8b93a8; margin-top: 0.3rem; }

/* ── Details / venue ── */
.rt-detail-label {
  font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: #8b93a8; margin: 1rem 0 0.2rem; text-align: center;
}
.rt-detail-value { font-size: 1.02rem; font-weight: 600; color: #12213f; margin: 0 0 0.15rem; text-align: center; }
.rt-btn {
  display: inline-block; margin-top: 0.5rem;
  border: 1px solid #c8a15c; color: #12213f; background: #fff;
  font-size: 0.85rem; font-weight: 600; letter-spacing: 0.06em;
  padding: 0.5rem 1.4rem; border-radius: 999px; text-decoration: none; cursor: pointer;
}

/* ── Dress-code luggage-tag chips ── */
.rt-dress-block { margin-top: 1.5rem; text-align: center; }
.rt-tags { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-top: 0.5rem; }
.rt-tag-chip {
  width: 26px; height: 26px; border-radius: 6px; display: inline-block;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(18,33,63,0.18), 0 3px 8px rgba(18,33,63,0.2);
}

/* ── Notes ── */
.rt-notes { margin-top: 1.5rem; }

/* ── Agenda ── */
.rt-agenda { margin-top: 0.4rem; }
.rt-agenda-row {
  display: flex; align-items: baseline; gap: 1rem;
  padding: 0.7rem 0; border-bottom: 1px dashed rgba(18,33,63,0.15);
}
.rt-agenda-time { flex-shrink: 0; width: 60px; font-size: 0.92rem; font-weight: 700; color: #12213f; }
.rt-agenda-activity { flex: 1; font-size: 0.92rem; color: #3a4258; }
.rt-note {
  margin-top: 1rem; padding: 0.8rem 1rem; border-radius: 8px;
  background: rgba(18,33,63,0.04); border: 1px dashed rgba(18,33,63,0.2);
  font-size: 0.82rem; font-style: italic; color: #5b6478; text-align: center; line-height: 1.5;
}

/* ── Gallery ── */
.rt-gallery {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;
  margin: 0.6rem 0 0;
}
.rt-gallery-photo { border-radius: 8px; overflow: hidden; cursor: zoom-in; }
.rt-gallery-photo img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; }
.rt-gallery-mono img { filter: grayscale(1) contrast(1.05); }

/* ── KHQR ── */
.rt-qr {
  display: block; width: 55%; max-width: 170px; margin: 0.6rem auto 0;
  border: 1px solid rgba(18,33,63,0.15); border-radius: 8px; background: #fff; padding: 10px;
}

/* ── Wishing / song suggestions ── */
.rt-wish-input {
  width: 100%; border: 1px solid rgba(18,33,63,0.2); border-radius: 8px;
  background: #f6f4ee; color: #12213f; font-size: 0.95rem; padding: 0.6rem 1.1rem;
}
.rt-wish-input::placeholder { color: #a2a9bc; }
.rt-wish-send {
  border: none; border-radius: 999px; background: #12213f; color: #c8a15c;
  font-size: 0.95rem; font-weight: 700; letter-spacing: 0.06em; padding: 0.6rem 1rem; cursor: pointer;
}
.rt-wish-card {
  border: 1px solid rgba(18,33,63,0.12); border-radius: 10px; background: #f6f4ee;
  padding: 0.8rem 1rem; margin-bottom: 0.7rem;
}
.rt-wish-msg { margin: 0 0 0.3rem; font-size: 0.95rem; color: #3a4258; line-height: 1.5; font-style: italic; }
.rt-wish-from { margin: 0; font-size: 0.82rem; font-weight: 700; color: #12213f; }

/* ── Footer ── */
.rt-foot { text-align: center; padding-bottom: 3rem; }
.rt-foot-emoji { font-size: 1.3rem; letter-spacing: 0.5rem; margin: 0.6rem 0 0.9rem; }
`;
