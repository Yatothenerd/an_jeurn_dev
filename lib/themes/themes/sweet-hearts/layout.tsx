import type { ThemeLayout } from "../../types";
import { ShFooterHearts } from "./sections";

// Sweet Hearts stacks every section on one continuous cream "paper" column
// over the pink page. The cover rounds the top, the footer rounds the bottom.
export const sweetLayout: ThemeLayout = {
  shellClass: "sh-invite",

  wrapCover(node) {
    return <section className="sh-section sh-first">{node}</section>;
  },

  wrapSection(node) {
    return <section className="sh-section">{node}</section>;
  },

  footer({ eventTitle }) {
    return (
      <section className="sh-section sh-last sh-foot">
        <ShFooterHearts />
        <p className="sh-title" style={{ marginBottom: "0.2rem" }}>We can&apos;t wait to see you!</p>
        <p className="sh-body">{eventTitle}</p>
      </section>
    );
  },
};
