import type { ThemeLayout } from "../../types";
import { Reveal } from "./sections";

// Cover renders its own full-bleed starfield; every following section fades up
// on scroll into view.
export const starlightLayout: ThemeLayout = {
  wrapCover(node) {
    return node;
  },

  wrapSection(node, { index, tokens }) {
    const surface = index % 2 === 0 ? tokens.altBg : tokens.bg;
    return <Reveal style={{ background: surface }}>{node}</Reveal>;
  },
};
