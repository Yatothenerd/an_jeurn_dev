interface Props {
  content: { url?: string; caption?: string };
  theme: { primary: string; muted: string; font: string };
}

export function VideoSection({ content, theme }: Props) {
  if (!content.url) return null;

  return (
    <section style={{ ...s.section, fontFamily: theme.font }}>
      <h2 style={{ ...s.heading, color: theme.primary }}>Video</h2>
      <div style={s.wrapper}>
        <iframe
          src={content.url}
          style={s.iframe}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="event video"
        />
      </div>
      {content.caption && (
        <p style={{ ...s.caption, color: theme.muted }}>{content.caption}</p>
      )}
    </section>
  );
}

const s = {
  section: { padding: "3rem 1.5rem" },
  heading: { margin: "0 0 1.25rem", fontSize: "1.5rem", fontWeight: 400, textAlign: "center" as const },
  wrapper: { position: "relative" as const, paddingTop: "56.25%", maxWidth: "480px", margin: "0 auto" },
  iframe: {
    position: "absolute" as const,
    top: 0, left: 0, width: "100%", height: "100%",
    border: "none", borderRadius: "12px",
  },
  caption: { textAlign: "center" as const, margin: "1rem 0 0", fontSize: "0.9375rem" },
} as const;
