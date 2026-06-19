import type { ThemeLayout } from "../types";
import { Reveal } from "./Reveal";

// Default chrome for token-only themes: the cover is followed by an optional
// decorative band, and subsequent sections alternate between `altBg` and `bg`
// while fading up on scroll (anime.js).
export const standardLayout: ThemeLayout = {
  wrapCover(node, t) {
    return (
      <>
        {node}
        {t.decoBand && (
          <div style={{ background: t.bg }}>
            <div className={`inv-deco-band ${t.decoBand.pattern} blend-${t.decoBand.blend}`} />
          </div>
        )}
      </>
    );
  },

  wrapSection(node, { index, tokens }) {
    const surface = index % 2 === 0 ? tokens.altBg : tokens.bg;
    return <Reveal style={{ background: surface }}>{node}</Reveal>;
  },
};
