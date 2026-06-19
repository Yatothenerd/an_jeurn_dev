import type { ThemeTokens } from "@/lib/themes/types";

interface DetailItem {
  icon: string;
  label: string;
  value: string;
}

interface Props {
  content: { title?: string; items?: DetailItem[] };
  venueName: string | null;
  venueMapUrl: string | null;
  theme: ThemeTokens;
}

export function DetailsSection({ content, venueName, venueMapUrl, theme }: Props) {
  const items = content.items ?? [];

  const rows: { icon: string; label: string; value?: string; mapHref?: string }[] = [
    ...items,
    ...(venueName ? [{ icon: "📍", label: "Venue", value: venueName }] : []),
    ...(venueMapUrl ? [{ icon: "🗺", label: "Map", mapHref: venueMapUrl }] : []),
  ];

  return (
    <section className="inv-section" style={{ fontFamily: theme.font }}>
      <div className="inv-section-title" style={{ color: theme.primary }}>
        <div className="line" /><span>{content.title || "Details"}</span><div className="line" />
      </div>
      <div className="inv-detail-card" style={{ background: theme.cardBg, borderColor: theme.border }}>
        {rows.map((row, i) => (
          <div
            key={i}
            className="inv-detail-row"
            style={{ borderBottom: i < rows.length - 1 ? `1px solid ${theme.border}` : "none" }}
          >
            <span className="inv-detail-icon">{row.icon}</span>
            <div>
              <p className="inv-detail-label" style={{ color: theme.accent }}>{row.label}</p>
              {row.mapHref ? (
                <a className="inv-map-link" href={row.mapHref} target="_blank" rel="noreferrer" style={{ color: theme.accent }}>
                  Open in Maps ↗
                </a>
              ) : (
                <p className="inv-detail-value" style={{ color: theme.primary }}>{row.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
