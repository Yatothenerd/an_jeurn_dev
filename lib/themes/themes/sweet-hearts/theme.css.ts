// Sweet Hearts — hand-drawn pink wedding theme. Cream paper column on a pink
// page, crimson handwritten headings, doodle hearts, polaroids, a calendar
// with the day circled, and a squiggly agenda timeline.

export const SWEET_CSS = `
/* ── Shell ── */
.invite-shell.sh-invite {
  background: linear-gradient(180deg, #f7a8c4 0%, #ee86ae 100%);
  padding: 14px 12px 7rem;
}
.sh-invite, .sh-invite button, .sh-invite input {
  font-family: 'Caveat', 'Kantumruy Pro', cursive;
}

/* ── Paper column ── */
.sh-section {
  background: #fdf9f1;
  padding: 2.3rem 1.4rem;
  position: relative;
  overflow: hidden;
}
.sh-section.sh-first { border-radius: 12px 12px 0 0; }
.sh-section.sh-last  { border-radius: 0 0 12px 12px; }

/* ── Typography ── */
.sh-title {
  font-family: 'Caveat', 'Kantumruy Pro', cursive;
  font-weight: 700;
  font-size: 2.1rem;
  line-height: 1.1;
  color: #d64545;
  text-align: center;
  margin: 0 0 0.9rem;
}
.sh-body {
  font-size: 1.12rem;
  font-weight: 500;
  line-height: 1.45;
  color: #6f4c4c;
  text-align: center;
  margin: 0.35rem 0;
}
.sh-small {
  font-size: 0.95rem;
  color: #a98080;
  text-align: center;
  margin: 0.2rem 0;
}

/* ── Cover ── */
.sh-cover { text-align: center; padding-top: 0.4rem; }
.sh-hang { display: block; width: 82%; max-width: 300px; margin: 0 auto 1.2rem; }
.sh-cover-line {
  font-size: 1.5rem;
  font-weight: 600;
  color: #d64545;
  line-height: 1.25;
  margin: 0.2rem 0 0;
  white-space: pre-line;
}
.sh-cover-big {
  font-family: 'Caveat', 'Kantumruy Pro', cursive;
  font-weight: 700;
  font-size: 3.1rem;
  line-height: 1;
  color: #d64545;
  margin: 0.1rem 0 1.2rem;
}
.sh-heartframe { position: relative; width: 270px; max-width: 88%; margin: 0 auto; }
.sh-heartframe .frame { display: block; width: 100%; height: auto; }
.sh-heartframe .photo {
  position: absolute;
  left: 50%; top: 46%;
  transform: translate(-50%, -50%);
  width: 58%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 6px;
  border: 3px solid #fff;
  box-shadow: 0 4px 14px rgba(140, 30, 50, 0.25);
}
.sh-pill {
  display: inline-block;
  background: #fad2da;
  color: #d64545;
  font-weight: 700;
  font-size: 1.7rem;
  padding: 0.35rem 2rem;
  border-radius: 999px;
  margin: 1.1rem auto 0.2rem;
}
.sh-guest {
  display: inline-block;
  border: 1.5px dashed #e8788f;
  color: #b04a5e;
  font-size: 1.2rem;
  font-weight: 600;
  padding: 0.25rem 1.4rem;
  border-radius: 999px;
  margin-top: 0.8rem;
}

/* ── Doodle divider ── */
.sh-squiggle { display: block; width: 120px; margin: 0.6rem auto; }

/* ── Polaroids ── */
.sh-polaroids {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin: 1.2rem 0 0.6rem;
}
.sh-polaroid {
  position: relative;
  background: #fff;
  border: 3px solid #c0392b;
  padding: 6px 6px 8px;
  width: 44%;
  max-width: 180px;
  box-shadow: 0 5px 12px rgba(140, 30, 50, 0.22);
}
.sh-polaroid img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; display: block; }
.sh-polaroid .bow { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-size: 1.2rem; }
.sh-polaroid:nth-child(odd)  { transform: rotate(-4deg); }
.sh-polaroid:nth-child(even) { transform: rotate(3.5deg); margin-top: 0.9rem; }

/* ── Calendar (When?) ── */
.sh-cal { max-width: 300px; margin: 0.4rem auto 0; }
.sh-cal-month {
  display: flex;
  justify-content: center;
  gap: 0.7rem;
  font-size: 1.35rem;
  font-weight: 600;
  color: #6f4c4c;
  margin-bottom: 0.6rem;
}
.sh-cal-month b { color: #d64545; font-weight: 700; }
.sh-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 0.25rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: #6f4c4c;
  text-align: center;
}
.sh-cal-day { position: relative; padding: 0.18rem 0; }
.sh-cal-day.on { color: #d64545; font-weight: 700; }
.sh-cal-day.on::after {
  content: "";
  position: absolute;
  left: 50%; top: 50%;
  width: 30px; height: 26px;
  transform: translate(-50%, -50%) rotate(-8deg);
  border: 2px solid #d64545;
  border-radius: 50%;
}
.sh-cal-count {
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: #b04a5e;
  margin-top: 1rem;
}

/* ── Timeline (What time?) ── */
.sh-tl { position: relative; padding: 0.3rem 0.4rem; }
.sh-tl-row { width: 58%; }
.sh-tl-row.right { margin-left: auto; text-align: left; }
.sh-tl-row.left  { text-align: right; }
.sh-tl-time {
  font-size: 1.9rem;
  font-weight: 700;
  color: #d64545;
  line-height: 1;
  margin: 0;
}
.sh-tl-name {
  font-size: 1.08rem;
  font-weight: 500;
  color: #6f4c4c;
  line-height: 1.3;
  margin: 0.15rem 0 0;
}
.sh-tl-curve { display: block; width: 110px; height: 56px; margin: 0.15rem auto; }
.sh-tl-deco { position: absolute; width: 34px; opacity: 0.9; }

/* ── Details / venue ── */
.sh-photo-card {
  display: block;
  width: 100%;
  border: 3px solid #c0392b;
  border-radius: 4px;
  margin: 1rem 0;
  box-shadow: 0 5px 12px rgba(140, 30, 50, 0.2);
}
.sh-btn {
  display: inline-block;
  border: 1.5px solid #d64545;
  color: #d64545;
  background: transparent;
  font-family: 'Caveat', 'Kantumruy Pro', cursive;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 0.3rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
}
.sh-center { text-align: center; }

/* Dress-code hearts */
.sh-dress {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.45rem;
  margin: 0.9rem 0 0.2rem;
}
.sh-dress svg { width: 34px; height: auto; }
.sh-dress svg:nth-child(odd)  { transform: rotate(-7deg); }
.sh-dress svg:nth-child(even) { transform: rotate(6deg); }

/* Oval note bubbles */
.sh-notes { display: flex; flex-direction: column; gap: 1.1rem; margin-top: 1.1rem; }
.sh-note {
  position: relative;
  border: 1.5px solid #e8788f;
  border-radius: 50%;
  padding: 1.5rem 2rem;
  width: 88%;
  font-size: 1.05rem;
  font-weight: 500;
  color: #6f4c4c;
  text-align: center;
  line-height: 1.35;
  background: #fffdf8;
}
.sh-note:nth-child(odd)  { align-self: flex-start; transform: rotate(-1.5deg); }
.sh-note:nth-child(even) { align-self: flex-end; transform: rotate(1.5deg); }
.sh-note .bow { position: absolute; top: -12px; left: 14%; font-size: 1.15rem; }

/* ── KHQR ── */
.sh-qr {
  display: block;
  width: 55%;
  max-width: 170px;
  margin: 0.6rem auto 0;
  border: 3px solid #c0392b;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
}

/* ── Wishing ── */
.sh-wish-input {
  width: 100%;
  border: 1.5px solid #e8788f;
  border-radius: 999px;
  background: #fffdf8;
  color: #6f4c4c;
  font-size: 1.05rem;
  font-weight: 500;
  padding: 0.55rem 1.1rem;
}
.sh-wish-input::placeholder { color: #c99aa4; }
.sh-wish-send {
  border: none;
  border-radius: 999px;
  background: #d64545;
  color: #fff8f4;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.55rem 1rem;
  cursor: pointer;
}
.sh-wish-card {
  border: 1.5px solid #f0b7c4;
  border-radius: 18px;
  background: #fffdf8;
  padding: 0.8rem 1rem;
  margin-bottom: 0.7rem;
}
.sh-wish-msg { margin: 0 0 0.3rem; font-size: 1.08rem; font-weight: 500; color: #6f4c4c; line-height: 1.35; }
.sh-wish-from { margin: 0; font-size: 0.98rem; font-weight: 600; color: #d64545; }

/* ── Footer ── */
.sh-foot { text-align: center; padding-bottom: 3rem; }
.sh-foot-hearts { display: flex; justify-content: center; gap: 0.4rem; margin-bottom: 0.6rem; }
.sh-foot-hearts svg { width: 26px; }
`;
