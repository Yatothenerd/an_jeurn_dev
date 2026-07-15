import type { ThemeLayout } from "../../types";
import { RtDivider, RtPlane } from "./sections";

// Royal Ticket stacks every section as a white boarding-pass stub — notched
// on both edges with a gold dashed perforation — floating over one
// continuous navy gradient (see .rt-invite in theme.css.ts).
export const royalTicketLayout: ThemeLayout = {
  shellClass: "rt-invite",

  wrapCover(node) {
    return (
      <section className="rt-section rt-first">
        <span className="rt-perf" />
        {node}
      </section>
    );
  },

  wrapSection(node) {
    return (
      <section className="rt-section">
        <span className="rt-perf" />
        {node}
      </section>
    );
  },

  footer({ eventTitle }) {
    return (
      <section className="rt-section rt-last rt-foot">
        <span className="rt-perf" />
        <RtDivider label="With Love" />
        <p className="rt-foot-emoji"><RtPlane size={20} /></p>
        <p className="rt-body" style={{ fontStyle: "italic", marginBottom: "0.4rem" }}>
          &ldquo;Thank you for joining us on this journey — we can&apos;t wait to celebrate with you.&rdquo;
        </p>
        <p className="rt-body">{eventTitle}</p>
      </section>
    );
  },
};
