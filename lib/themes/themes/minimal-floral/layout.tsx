import type { ThemeLayout } from "../../types";
import { MfFooterFloral } from "./sections";

// Minimal Floral stacks every section on one continuous cream card over a
// warm taupe page — a single unbroken column, rounded at the very top and
// very bottom only, matching the reference layout.
export const mfLayout: ThemeLayout = {
  shellClass: "mf-invite",

  wrapCover(node) {
    return <section className="mf-section mf-first">{node}</section>;
  },

  wrapSection(node) {
    return <section className="mf-section">{node}</section>;
  },

  footer({ eventTitle }) {
    return (
      <section className="mf-section mf-last mf-foot">
        <MfFooterFloral />
        <p className="mf-title" style={{ marginBottom: "0.2rem" }}>With love</p>
        <p className="mf-body">{eventTitle}</p>
      </section>
    );
  },
};
