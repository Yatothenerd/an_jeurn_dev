import type { ThemeLayout } from "../../types";

// Royal Khmer wraps each non-cover section in an ornate gold frame; the wishing
// section sits on a red panel, everything else on the patterned cream surface.
// The cover is full-bleed (no deco band), and the invite ends with a closing
// "thank you" panel.
export const khmerLayout: ThemeLayout = {
  shellClass: "rk-invite",

  wrapCover(node) {
    return node;
  },

  wrapSection(node, { type }) {
    const surface = type === "wishing" ? "rk-section red" : "rk-section cream rk-pattern";
    return (
      <section className={surface}>
        <div className="rk-fr1" />
        <div className="rk-fr2" />
        <span className="rk-corner tl" />
        <span className="rk-corner tr" />
        <span className="rk-corner bl" />
        <span className="rk-corner br" />
        <div className="rk-inner">{node}</div>
      </section>
    );
  },

  footer({ eventTitle }) {
    return (
      <section className="rk-section reddark">
        <div className="rk-foot">
          <p className="thx">សូមអរគុណ</p>
          <p className="thx-en">Thank You</p>
          <p className="names">{eventTitle}</p>
          <div className="rk-dots">
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>
    );
  },
};
