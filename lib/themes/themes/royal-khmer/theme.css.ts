// Royal Khmer bespoke layout (`.rk-*`) + the ornate gold corner frame
// (`.sec-frame`). Injected only when the Royal Khmer theme is active.

export const KHMER_CSS = `
/* ════════ Royal Khmer (rk-*) ════════ */
.rk-invite { font-family: 'Kantumruy Pro', sans-serif; color: #4a3728; background-color: #f9f7f4; background-image: radial-gradient(#b89f8a 0.5px, transparent 0.5px); background-size: 16px 16px; }
.rk-cover { position: relative; min-height: 90vh; padding: 2.6rem 1.3rem; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; gap: 1rem; color: #dcb287; background: repeating-linear-gradient(90deg, rgba(0,0,0,0.38) 0px, rgba(0,0,0,0.08) 14px, transparent 28px, rgba(0,0,0,0.08) 42px, rgba(0,0,0,0.38) 56px), radial-gradient(circle at 50% 16%, #800020 58%, #5a0016 100%); background-size: 56px 100%, auto; box-shadow: inset 0 0 90px rgba(0,0,0,0.6); }
.rk-cover::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 38px; background: radial-gradient(circle at 50% -40%, #800020 70%, #5a0016 100%); border-bottom: 2px solid #d4af37; border-radius: 0 0 100% 100% / 0 0 22% 22%; box-shadow: 0 4px 14px rgba(0,0,0,0.5); z-index: 1; }
.rk-frame { position: absolute; pointer-events: none; z-index: 1; }
.rk-frame.f1 { inset: 11px; border: 1px solid rgba(212,175,55,0.45); }
.rk-frame.f2 { inset: 16px; border: 1px solid rgba(212,175,55,0.22); }
.rk-monogram { width: 72px; height: auto; position: relative; z-index: 2; }
.rk-cover-mid { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; }
.rk-cover-kh { font-size: 0.8rem; color: #dcb287; letter-spacing: 0.03em; margin: 0; }
.rk-cover-en { font-size: 0.6rem; color: rgba(249,247,244,0.8); letter-spacing: 0.08em; margin: 0.1rem 0 0; }
.rk-nameplate { position: relative; display: flex; align-items: center; justify-content: center; margin: 0.6rem 0; min-height: 48px; width: 100%; }
.rk-nameplate img { position: absolute; width: 100%; max-width: 220px; opacity: 0.6; }
.rk-guest { position: relative; z-index: 2; font-family: 'Moulpali', serif; font-style: italic; font-size: 1.25rem; color: #fff; }
.rk-cdiv { width: 38px; height: 1px; background: rgba(212,175,55,0.5); margin: 0.5rem auto; }
.rk-section { position: relative; padding: 2.4rem 1.2rem; }
.rk-section.cream { background-color: #f9f7f4; background-image: radial-gradient(#b89f8a 0.5px, transparent 0.5px); background-size: 16px 16px; }
.rk-section.red { background: #800020; color: #f9f7f4; }
.rk-section.reddark { background: #5a0016; color: #f9f7f4; padding: 2.8rem 1.2rem; }
.rk-fr1 { position: absolute; inset: 8px; border: 1px solid rgba(212,175,55,0.2); pointer-events: none; }
.rk-fr2 { position: absolute; inset: 13px; border: 1px solid rgba(212,175,55,0.1); pointer-events: none; }
.rk-corner { position: absolute; width: 34px; height: 34px; background: url('/themes/khmer/corner.png') center/contain no-repeat; pointer-events: none; opacity: 0.85; z-index: 1; }
.rk-corner.tl { top: 6px; left: 6px; } .rk-corner.tr { top: 6px; right: 6px; transform: scaleX(-1); }
.rk-corner.bl { bottom: 6px; left: 6px; transform: scaleY(-1); } .rk-corner.br { bottom: 6px; right: 6px; transform: scale(-1); }
.rk-inner { position: relative; z-index: 2; }
.rk-title { font-family: 'Moulpali', serif; font-size: 1.15rem; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; color: #b76e79; position: relative; padding-bottom: 0.6rem; margin: 0 0 0.3rem; }
.rk-title::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 56px; height: 1px; background: rgba(212,175,55,0.5); }
.rk-title.cream-on-red { color: #d4af37; }
.rk-sub { text-align: center; font-size: 0.56rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(74,55,40,0.75); margin: 0 0 1rem; }
.rk-sub.on-red { color: rgba(212,175,55,0.8); }
.rk-pattern { background-image: url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 10 C65 30 85 35 110 30 C90 50 85 70 90 95 C70 85 50 85 30 95 C35 70 30 50 10 30 C35 35 55 30 60 10 Z' fill='none' stroke='%23d4af37' stroke-width='0.25' opacity='0.12'/%3E%3Ccircle cx='60' cy='60' r='2' fill='%23d4af37' opacity='0.08'/%3E%3C/svg%3E"); background-size: 120px 120px; }
.rk-body { font-size: 0.74rem; line-height: 1.6; color: rgba(74,55,40,0.85); text-align: center; margin: 0.3rem 0; }
.rk-body.en { font-size: 0.64rem; color: rgba(74,55,40,0.5); margin-top: 0.4rem; }
.rk-datebox { border-top: 1px solid rgba(212,175,55,0.35); border-bottom: 1px solid rgba(212,175,55,0.35); padding: 0.5rem 0.9rem; text-align: center; display: inline-block; margin: 0.6rem 0; }
.rk-agenda-row { display: grid; grid-template-columns: 46px 1fr; gap: 0.65rem; align-items: center; padding: 0.55rem 0.6rem; border: 1px solid rgba(212,175,55,0.2); border-radius: 3px; margin-bottom: 0.5rem; }
.rk-agenda-ic { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(184,159,138,0.3); background: rgba(184,159,138,0.12); display: flex; align-items: center; justify-content: center; }
.rk-agenda-ic img { width: 28px; height: 28px; object-fit: contain; }
.rk-agenda-time { font-size: 0.52rem; font-weight: 700; text-transform: uppercase; color: #b76e79; margin-bottom: 0.1rem; }
.rk-agenda-time small { display: block; font-weight: 400; color: rgba(74,55,40,0.65); }
.rk-agenda-kh { font-family: 'Kantumruy Pro', sans-serif; font-weight: 700; font-size: 0.62rem; color: #d4af37; line-height: 1.3; margin: 0; }
.rk-agenda-en { font-size: 0.54rem; color: rgba(74,55,40,0.8); margin: 0.1rem 0 0; }
.rk-venue-img { width: 100%; height: 120px; object-fit: cover; border: 1px solid rgba(212,175,55,0.2); border-radius: 3px; }
.rk-gal { display: grid; gap: 0.4rem; }
.rk-gal img { width: 100%; display: block; border-radius: 2px; border: 1px solid rgba(212,175,55,0.12); }
.rk-gal .two { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
.rk-btn { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; width: 100%; justify-content: center; padding: 0.6rem; border: 1px solid #d4af37; color: #d4af37; border-radius: 3px; font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.1em; background: transparent; margin-top: 0.7rem; text-decoration: none; }
.rk-foot { text-align: center; }
.rk-foot .thx { font-family: 'Moulpali', serif; font-size: 1.6rem; color: #b76e79; margin: 0; }
.rk-foot .thx-en { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(249,247,244,0.7); margin: 0.2rem 0 0; }
.rk-foot .names { font-size: 0.56rem; text-transform: uppercase; font-weight: 700; color: rgba(212,175,55,0.6); margin: 0.7rem 0 0; }
.rk-dots { display: flex; gap: 0.25rem; justify-content: center; margin-top: 0.6rem; }
.rk-dots i { width: 3px; height: 3px; border-radius: 50%; background: #d4af37; display: block; }

/* ════════ Royal Khmer — Light Cover (rk-cv2) ════════ */
.rk-cv2 { position: relative; display: flex; flex-direction: column; min-height: 90vh; font-family: 'Kantumruy Pro', sans-serif; color: #1a2a5a; background-color: #f5f3ee; background-image: url("data:image/svg+xml,%3Csvg width='800' height='22' viewBox='0 0 800 22' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 11 C100 3 200 19 400 11 C600 3 700 19 800 11' fill='none' stroke='%231a3daa' stroke-width='0.4' opacity='0.13'/%3E%3C/svg%3E"); background-size: 100% 22px; }
.rk-cv2-body { flex: 1; display: flex; flex-direction: row; }
.rk-cv2-left { flex: 1; padding: 2.2rem 1rem 1.5rem 1.4rem; display: flex; flex-direction: column; justify-content: center; gap: 0.85rem; }
.rk-cv2-kh { font-size: 0.72rem; color: #1a2a5a; line-height: 1.55; margin: 0; }
.rk-cv2-en { font-size: 0.52rem; color: #3a5a9a; text-transform: uppercase; letter-spacing: 0.09em; margin: 0.18rem 0 0; }
.rk-cv2-title { font-family: 'Moulpali', serif; font-size: 1rem; color: #1a2a5a; margin: 0; line-height: 1.35; }
.rk-cv2-divider { height: 1px; background: rgba(26,60,154,0.22); margin: 0.1rem 0; }
.rk-cv2-detail { font-size: 0.54rem; color: #3a5a9a; margin: 0.1rem 0 0; line-height: 1.45; }
.rk-cv2-guest-block { border-top: 1px solid rgba(26,60,154,0.18); padding-top: 0.6rem; margin-top: 0.1rem; }
.rk-cv2-guest-label { font-family: 'Moulpali', serif; font-size: 0.62rem; color: #1a3a80; margin: 0 0 0.2rem; }
.rk-cv2-guestname { font-family: 'Moulpali', serif; font-size: 0.88rem; color: #1a2a5a; line-height: 1.3; }
.rk-cv2-admit { font-size: 0.44rem; color: rgba(26,60,154,0.45); text-transform: uppercase; letter-spacing: 0.1em; margin: 0.25rem 0 0; }
.rk-cv2-right { width: 42%; max-width: 150px; border-left: 2px solid rgba(30,80,200,0.35); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem 0.5rem; gap: 1rem; color: #3a78c9; }
.rk-kbach { width: 90%; max-width: 124px; opacity: 0.82; }
.rk-cv2-bottom { flex-shrink: 0; height: 54px; background-color: #1a237e; background-image: url("data:image/svg+xml,%3Csvg width='54' height='54' viewBox='0 0 54 54' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M27 5 L49 27 L27 49 L5 27 Z' fill='none' stroke='%23ffffff' stroke-width='0.9' opacity='0.35'/%3E%3Cpath d='M27 13 L41 27 L27 41 L13 27 Z' fill='none' stroke='%23ffffff' stroke-width='0.7' opacity='0.28'/%3E%3Ccircle cx='27' cy='27' r='3.5' fill='%23ffffff' opacity='0.22'/%3E%3C/svg%3E"); background-repeat: repeat-x; background-size: 54px 54px; }

/* Ornate gold corner frame wrapper (Khmer applies to every section) */
.sec-frame { position: relative; }
.sec-frame > .sec-corner { position: absolute; width: 46px; height: 58px; background: var(--sec-accent, #d4af37); -webkit-mask: url('/themes/khmer/corner.png') center / contain no-repeat; mask: url('/themes/khmer/corner.png') center / contain no-repeat; pointer-events: none; opacity: 0.9; z-index: 5; }
/* Admin-uploaded background for a text-based section (scrim + light text). */
.rk-bgpanel { position: relative; border-radius: 6px; overflow: hidden; background-size: cover; background-position: center; }
.rk-bgpanel::before { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.72)); }
.rk-bgpanel-inner { position: relative; padding: 1.5rem 1.25rem; }
.rk-bgpanel .rk-title { color: #fff; }
.rk-bgpanel .rk-title::after { background: rgba(255,255,255,0.5); }
.rk-bgpanel .rk-sub { color: rgba(255,255,255,0.85); }
.rk-bgpanel .rk-body { color: rgba(255,255,255,0.92); }
.rk-bgpanel .rk-agenda-kh { color: #f5e3c0; }
.rk-bgpanel .rk-agenda-en { color: rgba(255,255,255,0.85); }
.rk-bgpanel .rk-agenda-time { color: #f3c9d0; }

.sec-corner.tl { top: 8px; left: 8px; }
.sec-corner.tr { top: 8px; right: 8px; transform: scaleX(-1); }
.sec-corner.bl { bottom: 8px; left: 8px; transform: scaleY(-1); }
.sec-corner.br { bottom: 8px; right: 8px; transform: scale(-1); }
`;
