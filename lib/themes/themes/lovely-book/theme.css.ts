// Lovely Book — a cream & burgundy "storybook letter" theme: gold-trimmed
// cards, a hand-drawn bow & cake, an oval photo frame, a Saturday-first week
// strip with the event day hearted, a ruled agenda table, and a scattered
// polaroid gallery. Bold Khmer display type (Moulpali) pairs with an italic
// Playfair Display caption under every heading.

export const LOVELY_CSS = `
/* ── Shell ──
   One soft gradient (pink fading to cream) painted behind the whole scroll —
   fixed attachment so it reads as one continuous blend, not a reset per
   section. Sections themselves stay transparent so it shows through. ── */
.invite-shell.lb-invite {
  background: linear-gradient(180deg, #fbe3ea 0%, #fbeee1 480px, #f3ecdc 100%);
  background-attachment: fixed;
  padding: 14px 10px 7rem;
}
.lb-invite, .lb-invite button, .lb-invite input, .lb-invite textarea {
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
}

/* ── Opening gate — the shared .inv-gate card, restyled into Lovely Book's
   floating double-border "letter" card entirely via CSS (no changes to the
   InviteGate component itself; these rules only load when this theme is
   active). The bow/cherub flourish comes from ThemeModule.gateDecoration,
   rendered by InviteGate as an ordinary overlay — see LbGateDecoration. ── */
body:has(.lb-invite) { background: #f3ecdc; }
.inv-gate {
  width: calc(100% - 32px);
  margin: 16px auto;
  height: calc(100vh - 32px);
  height: calc(100svh - 32px);
  border-radius: 26px;
  border: 1px solid #cba45c;
  box-shadow: inset 0 0 0 5px #fdf8ee, inset 0 0 0 6px #7c1f34;
  background: #fdf8ee !important;
  padding: 6.4rem 1.6rem 2.6rem;
  /* Cluster content around the vertical center with a fixed gap, instead of
     the base theme's space-between (which stretches sparse text across the
     full card height and reads as an empty gate when no monogram is set). */
  justify-content: center !important;
  gap: 2.4rem;
}
.inv-gate img[alt="Monogram"] {
  width: 108px !important; height: 108px !important;
  border: 3px solid #cba45c;
  box-shadow: 0 6px 18px rgba(124,31,52,0.22);
}
.inv-gate .inv-pretitle {
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
  font-weight: 700;
  color: #d9738a;
}
.inv-gate .inv-script {
  font-family: 'Moulpali', 'Playfair Display', serif;
  font-size: 1.55rem;
  line-height: 1.4;
  color: #7c1f34 !important;
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
  border: 1px solid rgba(124,31,52,0.3);
  border-radius: 12px;
  background: rgba(124,31,52,0.03);
  padding: 0.7rem 1.2rem;
  max-width: 300px;
  margin: 0 auto;
}
.inv-gate-open-label {
  background: #7c1f34 !important;
  color: #fdf8ee !important;
  font-family: 'Kantumruy Pro', 'Nunito', sans-serif;
  font-weight: 700;
  padding: 0.75rem 2rem !important;
}

/* ── Paper column: a faint full-width pinstripe texture, plus a solid gold
   rule running down each edge (the page-border look from the reference). ── */
.lb-section {
  position: relative;
  background: transparent;
  background-image: repeating-linear-gradient(90deg, rgba(124,31,52,0.05) 0 1px, transparent 1px 24px);
  padding: 2.4rem 1.9rem;
  overflow: hidden;
}
.lb-section::before, .lb-section::after {
  content: "";
  position: absolute;
  top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, transparent 0%, #cba45c 6%, #cba45c 94%, transparent 100%);
}
.lb-section::before { left: 9px; }
.lb-section::after  { right: 9px; }
.lb-section.lb-first { border-radius: 14px 14px 0 0; }
.lb-section.lb-last  { border-radius: 0 0 14px 14px; }

/* ── Typography ── */
.lb-body {
  font-size: 1rem;
  line-height: 1.65;
  color: #3a332c;
  text-align: center;
  margin: 0.4rem 0;
}
.lb-small {
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9c8d7f;
  text-align: center;
  margin: 0.15rem 0;
}

/* ── Section head: dashed divider + heart/dots, then Khmer + italic caption ── */
.lb-divider { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 0 0 1.1rem; }
.lb-divider .line {
  flex: 1; max-width: 80px; height: 0;
  border-top: 1px dashed rgba(124,31,52,0.4);
}
.lb-divider .tag {
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: #7c1f34; white-space: nowrap;
}
.lb-head { text-align: center; margin-bottom: 1.3rem; }
.lb-head h3 {
  font-family: 'Moulpali', 'Playfair Display', serif;
  font-weight: 400;
  font-size: 1.55rem;
  line-height: 1.3;
  color: #7c1f34;
  margin: 0 0 0.15rem;
}
.lb-head .cap {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 1.05rem;
  color: #9c6b78;
  margin: 0 0 0.7rem;
}
.lb-head .rule { width: 46px; height: 1px; background: #7c1f34; opacity: 0.55; margin: 0 auto; }

/* ── Cover ── */
.lb-cover { text-align: center; padding-top: 0.2rem; }
.lb-cherubs { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: -1.6rem; }
.lb-cherubs svg { width: 46px; height: auto; opacity: 0.55; }
.lb-bow { width: 40px; height: auto; margin: 0 auto 0.3rem; display: block; }
.lb-cake { width: 34px; height: auto; margin: 0.6rem auto 0.3rem; display: block; }
.lb-eyebrow {
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
  color: #7c1f34; margin: 0.2rem 0 0.6rem;
}
.lb-big {
  font-family: 'Moulpali', 'Playfair Display', serif;
  font-weight: 400;
  font-size: 1.8rem;
  line-height: 1.35;
  color: #7c1f34;
  margin: 0 0 0.9rem;
}
.lb-guestpill {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: #fff; border: 1px solid rgba(124,31,52,0.3);
  color: #7c1f34; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 0.35rem 0.9rem; border-radius: 999px;
  margin: 0.4rem 0 0.6rem;
}
.lb-guestbox {
  display: block; max-width: 300px; margin: 0 auto 1.1rem;
  border: 1px solid rgba(124,31,52,0.3); border-radius: 12px;
  background: rgba(124,31,52,0.03);
  padding: 0.7rem 1.2rem;
  font-style: italic; color: #9c8d7f; font-size: 0.92rem;
}
.lb-guestbox.has-name { font-style: normal; color: #7c1f34; font-weight: 600; }
.lb-date { margin-top: 0.6rem; }

/* ── Wording / greeting: oval photo + names ── */
.lb-oval-wrap { width: 168px; max-width: 60%; margin: 0 auto 1rem; }
.lb-oval {
  position: relative;
  width: 100%; aspect-ratio: 4 / 4.6;
  border-radius: 50% / 45%;
  border: 3px solid #cba45c;
  padding: 5px;
  box-shadow: 0 6px 18px rgba(124,31,52,0.18);
}
.lb-oval img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  border-radius: 50% / 45%;
}
.lb-names {
  font-family: 'Moulpali', 'Playfair Display', serif;
  font-weight: 400;
  font-size: 1.5rem;
  line-height: 1.35;
  color: #7c1f34;
  text-align: center;
  margin: 0.7rem 0 0.3rem;
}

/* ── Week strip (countdown) ── */
.lb-week {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.3rem;
  max-width: 340px; margin: 0.6rem auto 0;
  background: #fff; border-radius: 14px; padding: 0.9rem 0.5rem;
  box-shadow: 0 4px 16px rgba(124,31,52,0.1);
}
.lb-week-day { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
.lb-week-lbl { font-size: 0.56rem; font-weight: 700; letter-spacing: 0.06em; color: #9c8d7f; }
.lb-week-num { font-size: 0.95rem; font-weight: 600; color: #3a332c; }
.lb-week-day.on .lb-week-num { color: #d64545; font-weight: 700; }
.lb-week-day.on .lb-week-lbl { color: #d64545; }
.lb-cd-count { text-align: center; font-size: 0.85rem; color: #9c6b78; margin-top: 0.8rem; }

/* ── Details / venue ── */
.lb-venue-photo {
  border-radius: 14px; overflow: hidden; border: 4px solid #fff;
  box-shadow: 0 8px 22px rgba(124,31,52,0.2);
  margin: 0 0 0.4rem;
}
.lb-venue-photo img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; }
.lb-detail-label {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: #9c8d7f; margin: 1rem 0 0.15rem; text-align: center;
}
.lb-detail-value { font-size: 1.02rem; font-weight: 600; color: #7c1f34; margin: 0 0 0.15rem; text-align: center; }
.lb-btn {
  display: inline-block; margin-top: 0.5rem;
  border: 1px solid #7c1f34; color: #7c1f34; background: #fff;
  font-size: 0.85rem; font-weight: 600; letter-spacing: 0.06em;
  padding: 0.5rem 1.4rem; border-radius: 999px; text-decoration: none; cursor: pointer;
}
.lb-venue-icon { display: block; width: 90px; height: auto; margin: 1.4rem auto 0; }

/* ── Agenda table ── */
.lb-agenda-head {
  display: flex; justify-content: space-between;
  font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: #9c8d7f; border-bottom: 1px solid rgba(124,31,52,0.2); padding-bottom: 0.4rem; margin-bottom: 0.2rem;
}
.lb-agenda-row {
  display: flex; gap: 1rem; align-items: baseline;
  padding: 0.75rem 0; border-bottom: 1px solid rgba(124,31,52,0.12);
}
.lb-agenda-time { flex-shrink: 0; width: 76px; font-size: 0.92rem; font-weight: 700; color: #7c1f34; }
.lb-agenda-activity { flex: 1; font-size: 0.92rem; color: #3a332c; line-height: 1.5; }
.lb-agenda-activity small { display: block; font-size: 0.7rem; letter-spacing: 0.04em; color: #9c8d7f; margin-top: 0.15rem; text-transform: uppercase; }
.lb-note {
  margin-top: 1rem; padding: 0.8rem 1rem; border-radius: 10px;
  background: rgba(124,31,52,0.05); border: 1px dashed rgba(124,31,52,0.25);
  font-size: 0.82rem; font-style: italic; color: #9c6b78; text-align: center; line-height: 1.5;
}

/* ── Polaroid gallery ── */
.lb-polaroids {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem 0.7rem;
  margin: 0.6rem 0.4rem 0;
}
.lb-polaroid {
  background: #fff; padding: 8px 8px 14px; border-radius: 3px;
  box-shadow: 0 6px 16px rgba(124,31,52,0.18);
  cursor: zoom-in;
}
.lb-polaroid img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; border-radius: 2px; }
.lb-polaroid:nth-child(4n+1) { transform: rotate(-3deg); }
.lb-polaroid:nth-child(4n+2) { transform: rotate(2.5deg); margin-top: 0.6rem; }
.lb-polaroid:nth-child(4n+3) { transform: rotate(2deg); }
.lb-polaroid:nth-child(4n+4) { transform: rotate(-2.5deg); margin-top: 0.6rem; }

/* ── KHQR ── */
.lb-qr {
  display: block; width: 55%; max-width: 170px; margin: 0.6rem auto 0;
  border: 1px solid rgba(124,31,52,0.25); border-radius: 10px; background: #fff; padding: 10px;
}

/* ── Wishing ── */
.lb-wish-input {
  width: 100%; border: 1px solid rgba(124,31,52,0.3); border-radius: 999px;
  background: #fff; color: #3a332c; font-size: 0.95rem; padding: 0.6rem 1.1rem;
}
.lb-wish-input::placeholder { color: #b7a99e; }
.lb-wish-send {
  border: none; border-radius: 999px; background: #7c1f34; color: #fdf8ee;
  font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em; padding: 0.6rem 1rem; cursor: pointer;
}
.lb-wish-card {
  border: 1px solid rgba(124,31,52,0.18); border-radius: 12px; background: #fff;
  padding: 0.8rem 1rem; margin-bottom: 0.7rem;
}
.lb-wish-msg { margin: 0 0 0.3rem; font-size: 0.95rem; color: #3a332c; line-height: 1.5; font-style: italic; }
.lb-wish-from { margin: 0; font-size: 0.82rem; font-weight: 700; color: #7c1f34; }

/* ── Footer ── */
.lb-foot { text-align: center; padding-bottom: 3rem; }
.lb-foot .lb-bow { width: 32px; margin-top: 1.2rem; }
.lb-foot-emoji { font-size: 1.5rem; letter-spacing: 0.4rem; margin: 0 0 0.9rem; }
`;
