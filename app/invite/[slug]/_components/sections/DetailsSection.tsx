interface DetailItem {
  icon: string;
  label: string;
  value: string;
}

interface Props {
  content: { items?: DetailItem[] };
  venueName: string | null;
  venueMapUrl: string | null;
  theme: { primary: string; accent: string; text: string; muted: string; cardBg: string; border: string; font: string };
}

export function DetailsSection({ content, venueName, venueMapUrl, theme }: Props) {
  const items = content.items ?? [];

  return (
    <section style={{ ...s.section, fontFamily: theme.font }}>
      <h2 style={{ ...s.heading, color: theme.primary }}>Event Details</h2>
      <div style={s.card}>
        {items.map((item, i) => (
          <div key={i} style={{ ...s.row, borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : "none" }}>
            <span style={s.icon}>{item.icon}</span>
            <div style={s.rowContent}>
              <span style={{ ...s.rowLabel, color: theme.muted }}>{item.label}</span>
              <span style={{ ...s.rowValue, color: theme.primary }}>{item.value}</span>
            </div>
          </div>
        ))}
        {venueName && (
          <div style={{ ...s.row, borderBottom: venueMapUrl ? `1px solid ${theme.border}` : "none" }}>
            <span style={s.icon}>📍</span>
            <div style={s.rowContent}>
              <span style={{ ...s.rowLabel, color: theme.muted }}>Venue</span>
              <span style={{ ...s.rowValue, color: theme.primary }}>{venueName}</span>
            </div>
          </div>
        )}
        {venueMapUrl && (
          <div style={s.row}>
            <span style={s.icon}>🗺</span>
            <div style={s.rowContent}>
              <a
                href={venueMapUrl}
                target="_blank"
                rel="noreferrer"
                style={{ ...s.mapLink, color: theme.accent }}
              >
                Open in Maps ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const s = {
  section: { padding: "3rem 1.5rem", maxWidth: "480px", margin: "0 auto" },
  heading: { margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 400, textAlign: "center" as const },
  card: { borderRadius: "16px", overflow: "hidden", border: "1px solid", borderColor: "inherit" },
  row: { display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "1rem 1.25rem" },
  icon: { fontSize: "1.25rem", marginTop: "0.125rem", flexShrink: 0 },
  rowContent: { display: "flex", flexDirection: "column" as const, gap: "0.125rem" },
  rowLabel: { fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" as const },
  rowValue: { fontSize: "1rem", fontWeight: 500 },
  mapLink: { fontSize: "0.9375rem", fontWeight: 500, textDecoration: "none" },
} as const;
