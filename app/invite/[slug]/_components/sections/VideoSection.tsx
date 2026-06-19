import type { ThemeTokens } from "@/lib/themes/types";

interface Props {
  content: { url?: string; caption?: string; title?: string };
  theme: ThemeTokens;
}

export function VideoSection({ content, theme }: Props) {
  if (!content.url) return null;

  const player = (
    <>
      <div style={s.wrapper}>
        <iframe
          src={content.url}
          style={s.iframe}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="event video"
        />
      </div>
      {content.caption && <p style={{ ...s.caption, color: theme.muted }}>{content.caption}</p>}
    </>
  );

  return (
    <section className="inv-section" style={{ fontFamily: theme.font }}>
      <div className="inv-section-title" style={{ color: theme.primary }}>
        <div className="line" /><span>{content.title || "Video"}</span><div className="line" />
      </div>
      {player}
    </section>
  );
}

const s = {
  wrapper: { position: "relative" as const, paddingTop: "56.25%", maxWidth: "480px", margin: "0 auto" },
  iframe: { position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: "12px" },
  caption: { textAlign: "center" as const, margin: "1rem 0 0", fontSize: "0.9375rem" },
} as const;
