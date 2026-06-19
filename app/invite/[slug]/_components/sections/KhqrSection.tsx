import Image from "next/image";
import type { ThemeTokens } from "@/lib/themes/types";

interface Props {
  content: { title?: string; recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string };
  theme: ThemeTokens;
}

export function KhqrSection({ content, theme }: Props) {
  if (!content.qrImageUrl) return null;

  return (
    <section className="inv-section" style={{ fontFamily: theme.font, textAlign: "center" }}>
      <div className="inv-section-title" style={{ color: theme.primary }}>
        <div className="line" /><span>{content.title || "Contribution"}</span><div className="line" />
      </div>
      <div style={{ ...s.card, background: theme.cardBg, border: `1px solid ${theme.border}` }}>
        <Image src={content.qrImageUrl} alt="KHQR Code" width={220} height={220} style={s.qr} unoptimized />
        {content.recipientName && <p style={{ ...s.name, color: theme.primary }}>{content.recipientName}</p>}
        {content.amount && (
          <p style={{ ...s.amount, color: theme.accent }}>{content.currency ?? "USD"} {content.amount}</p>
        )}
        <p style={{ ...s.note, color: theme.muted }}>Scan with your banking app</p>
      </div>
    </section>
  );
}

const s = {
  card: { display: "inline-flex", flexDirection: "column" as const, alignItems: "center", gap: "0.75rem", padding: "1.5rem", borderRadius: "16px" },
  qr: { borderRadius: "8px" },
  name: { margin: 0, fontSize: "1.125rem", fontWeight: 600 },
  amount: { margin: 0, fontSize: "1.25rem", fontWeight: 700 },
  note: { margin: 0, fontSize: "0.8125rem" },
} as const;
