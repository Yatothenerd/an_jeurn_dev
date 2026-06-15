import Image from "next/image";

interface Props {
  content: { recipientName?: string; amount?: string; currency?: string; qrImageUrl?: string };
  theme: { primary: string; accent: string; muted: string; cardBg: string; border: string; font: string };
}

export function KhqrSection({ content, theme }: Props) {
  if (!content.qrImageUrl) return null;

  return (
    <section style={{ ...s.section, fontFamily: theme.font }}>
      <h2 style={{ ...s.heading, color: theme.primary }}>Contribution (KHQR)</h2>
      <div style={{ ...s.card, background: theme.cardBg, border: `1px solid ${theme.border}` }}>
        <Image
          src={content.qrImageUrl}
          alt="KHQR Code"
          width={220}
          height={220}
          style={s.qr}
          unoptimized
        />
        {content.recipientName && (
          <p style={{ ...s.name, color: theme.primary }}>{content.recipientName}</p>
        )}
        {content.amount && (
          <p style={{ ...s.amount, color: theme.accent }}>
            {content.currency ?? "USD"} {content.amount}
          </p>
        )}
        <p style={{ ...s.note, color: theme.muted }}>Scan with your banking app</p>
      </div>
    </section>
  );
}

const s = {
  section: { padding: "3rem 1.5rem", textAlign: "center" as const },
  heading: { margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 400 },
  card: { display: "inline-flex", flexDirection: "column" as const, alignItems: "center", gap: "0.75rem", padding: "1.5rem", borderRadius: "16px" },
  qr: { borderRadius: "8px" },
  name: { margin: 0, fontSize: "1.125rem", fontWeight: 600 },
  amount: { margin: 0, fontSize: "1.25rem", fontWeight: 700 },
  note: { margin: 0, fontSize: "0.8125rem" },
} as const;
