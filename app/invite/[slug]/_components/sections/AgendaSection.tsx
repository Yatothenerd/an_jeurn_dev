import type { ThemeTokens } from "@/lib/themes/types";

interface AgendaItem {
  time?: string;
  timeEn?: string;
  title?: string;
  titleEn?: string;
  icon?: number | string;
}

interface Props {
  content: { title?: string; subtitle?: string; items?: AgendaItem[] };
  theme: ThemeTokens;
}

export function AgendaSection({ content, theme }: Props) {
  const items = content.items ?? [];

  return (
    <section className="inv-section" style={{ fontFamily: theme.font }}>
      <div className="inv-section-title" style={{ color: theme.primary }}>
        <div className="line" /><span>{content.title || "Order of Ceremony"}</span><div className="line" />
      </div>
      <div className="inv-detail-card" style={{ background: theme.cardBg, borderColor: theme.border }}>
        {items.map((item, i) => (
          <div
            key={i}
            className="inv-agenda-row"
            style={{ borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : "none" }}
          >
            {item.icon ? (
              <img className="inv-agenda-icon" src={`/themes/agenda/${item.icon}.png`} alt="" />
            ) : (
              <span className="inv-agenda-icon" style={{ color: theme.accent, textAlign: "center" }}>◆</span>
            )}
            <span className="inv-agenda-time" style={{ color: theme.accent }}>
              {item.time}
              {item.timeEn && <small style={{ color: theme.muted }}>{item.timeEn}</small>}
            </span>
            <span className="inv-agenda-label" style={{ color: theme.text }}>{item.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
