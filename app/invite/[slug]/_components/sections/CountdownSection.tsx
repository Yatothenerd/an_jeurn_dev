"use client";

import type { ThemeTokens } from "@/lib/themes/types";
import { useCountdown } from "@/lib/themes/shared/use-countdown";

interface Props {
  targetDate: string;
  label?: string;
  eventDate: string;
  theme: ThemeTokens;
}

export function CountdownSection({ targetDate, label, eventDate, theme }: Props) {
  const time = useCountdown(targetDate, eventDate);

  const units = [
    { value: time.days, label: "Days" },
    { value: time.hours, label: "Hours" },
    { value: time.minutes, label: "Mins" },
    { value: time.seconds, label: "Secs" },
  ];

  return (
    <section className="inv-section" style={{ fontFamily: theme.font }}>
      <div className="inv-section-title" style={{ color: theme.primary }}>
        <div className="line" /><span>{label || "Countdown"}</span><div className="line" />
      </div>
      {time.expired ? (
        <p style={{ textAlign: "center", color: theme.primary, fontFamily: theme.font, fontSize: "1.5rem", fontWeight: 300 }}>
          The day has arrived!
        </p>
      ) : (
        <div className="inv-countdown">
          {units.map((u) => (
            <div key={u.label} className="inv-cd-unit" style={{ background: theme.cardBg, borderColor: theme.border }}>
              <span className="inv-cd-num" style={{ color: theme.primary }}>{String(u.value).padStart(2, "0")}</span>
              <span className="inv-cd-lbl" style={{ color: theme.accent }}>{u.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
