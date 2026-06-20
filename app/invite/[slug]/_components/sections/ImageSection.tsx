import type { ThemeTokens } from "@/lib/themes/types";

interface Props {
  content: { imageUrl?: string; title?: string; caption?: string };
  theme: ThemeTokens;
}

// An uploaded image used as the section's content (instead of HTML text).
export function ImageSection({ content, theme }: Props) {
  if (!content.imageUrl) return null;
  return (
    <section className="inv-section" style={{ fontFamily: theme.font }}>
      {content.title && (
        <div className="inv-section-title" style={{ color: theme.primary }}>
          <div className="line" /><span>{content.title}</span><div className="line" />
        </div>
      )}
      <img
        src={content.imageUrl}
        alt={content.caption || content.title || ""}
        style={{ width: "100%", borderRadius: "12px", display: "block" }}
      />
      {content.caption && (
        <p style={{ textAlign: "center", color: theme.muted, fontSize: "0.9rem", margin: "0.6rem 0 0", fontStyle: "italic" }}>
          {content.caption}
        </p>
      )}
    </section>
  );
}
