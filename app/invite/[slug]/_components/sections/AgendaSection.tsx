interface AgendaItem {
  time?: string;
  timeEn?: string;
  title?: string;
  icon?: number | string;
}

interface Props {
  content: { title?: string; subtitle?: string; items?: AgendaItem[] };
  theme: {
    bg: string; cardBg: string; primary: string; accent: string;
    text: string; muted: string; border: string; font: string;
  };
}

export function AgendaSection({ content, theme }: Props) {
  const items = content.items ?? [];

  return (
    <section style={{ ...s.section, background: theme.bg, fontFamily: theme.font }}>
      <h2 style={{ ...s.title, color: theme.primary }}>{content.title || "Order of Ceremony"}</h2>
      <div style={{ ...s.underline, background: theme.accent }} />
      {content.subtitle && (
        <p style={{ ...s.subtitle, color: theme.muted }}>{content.subtitle}</p>
      )}

      <div style={s.list}>
        {items.map((item, i) => (
          <div key={i} style={{ ...s.row, background: theme.cardBg, borderColor: theme.border }}>
            <div style={{ ...s.iconWrap, borderColor: theme.border }}>
              {item.icon ? (
                <img src={`/themes/agenda/${item.icon}.png`} alt="" style={s.icon} />
              ) : (
                <span style={{ color: theme.accent }}>◆</span>
              )}
            </div>
            <div>
              {item.time && (
                <p style={{ ...s.time, color: theme.accent }}>
                  {item.time}
                  {item.timeEn && <span style={{ ...s.timeEn, color: theme.muted }}>{item.timeEn}</span>}
                </p>
              )}
              <p style={{ ...s.itemTitle, color: theme.text }}>{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const s = {
  section: { padding: "2.75rem 1.25rem", textAlign: "center" as const },
  title: { margin: 0, fontSize: "1.5rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const },
  underline: { width: "54px", height: "1px", margin: "0.625rem auto 0", opacity: 0.5 },
  subtitle: { margin: "0.5rem 0 0", fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase" as const },
  list: { display: "flex", flexDirection: "column" as const, gap: "0.625rem", marginTop: "1.5rem", textAlign: "left" as const },
  row: {
    display: "grid",
    gridTemplateColumns: "52px 1fr",
    gap: "0.875rem",
    alignItems: "center",
    padding: "0.75rem 0.875rem",
    border: "1px solid",
    borderRadius: "4px",
  },
  iconWrap: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: { width: "32px", height: "32px", objectFit: "contain" as const },
  time: { margin: 0, fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  timeEn: { display: "block", fontSize: "0.625rem", fontWeight: 400, textTransform: "none" as const, opacity: 0.85 },
  itemTitle: { margin: "0.2rem 0 0", fontSize: "0.875rem", lineHeight: 1.4 },
} as const;
