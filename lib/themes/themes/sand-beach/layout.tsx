import type { ThemeLayout } from "../../types";
import { SbBow, SbDivider } from "./sections";

// Sand Beach stacks every section as a soft lace-scalloped card floating over
// one continuous sky-to-sand gradient (see .sb-invite in theme.css.ts).
export const sandBeachLayout: ThemeLayout = {
  shellClass: "sb-invite",

  wrapCover(node) {
    return <section className="sb-section sb-first">{node}</section>;
  },

  wrapSection(node) {
    return <section className="sb-section">{node}</section>;
  },

  footer({ eventTitle }) {
    return (
      <section className="sb-section sb-last sb-foot">
        <SbDivider label="With Love" />
        <p className="sb-foot-emoji">✧ 🐚 ✧</p>
        <p className="sb-body" style={{ fontStyle: "italic", marginBottom: "0.4rem" }}>
          &ldquo;Your presence is the greatest gift — we can&apos;t wait to celebrate with you.&rdquo;
        </p>
        <p className="sb-body">{eventTitle}</p>
        <SbBow size={56} />
      </section>
    );
  },
};
