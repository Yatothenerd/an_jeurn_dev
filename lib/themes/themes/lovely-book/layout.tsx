import type { ThemeLayout } from "../../types";
import { LbBow, LbDivider } from "./sections";

// Lovely Book stacks every section on one continuous cream "paper" column,
// each edged with a ruled book-margin (see .lb-section in theme.css.ts).
// The cover rounds the top, the footer rounds the bottom.
export const lovelyLayout: ThemeLayout = {
  shellClass: "lb-invite",

  wrapCover(node) {
    return <section className="lb-section lb-first">{node}</section>;
  },

  wrapSection(node) {
    return <section className="lb-section">{node}</section>;
  },

  footer({ eventTitle }) {
    return (
      <section className="lb-section lb-last lb-foot">
        <LbDivider label="Thank You" />
        <p className="lb-foot-emoji">🧸 🎊 ✨</p>
        <p className="lb-big" style={{ fontSize: "1.05rem", fontStyle: "italic", marginBottom: "0.4rem" }}>
          &ldquo;Your presence means the world to us — we can&apos;t wait to share sweet memories!&rdquo;
        </p>
        <p className="lb-body">{eventTitle}</p>
        <LbBow />
      </section>
    );
  },
};
