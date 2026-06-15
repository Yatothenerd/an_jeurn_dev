"use client";

import { useEffect, useState } from "react";

interface Props {
  targetDate: string;
  label?: string;
  eventDate: string;
  theme: { primary: string; accent: string; text: string; cardBg: string; border: string; font: string };
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getTimeLeft(target: string, eventDate: string): TimeLeft {
  const to = target ? new Date(target).getTime() : new Date(eventDate).getTime();
  const diff = to - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: false,
  };
}

export function CountdownSection({ targetDate, label, eventDate, theme }: Props) {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(targetDate, eventDate));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(targetDate, eventDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate, eventDate]);

  const units = [
    { value: time.days, label: "Days" },
    { value: time.hours, label: "Hours" },
    { value: time.minutes, label: "Minutes" },
    { value: time.seconds, label: "Seconds" },
  ];

  return (
    <section style={{ ...s.section, fontFamily: theme.font }}>
      <p style={{ ...s.label, color: theme.accent }}>{label || "Counting down to"}</p>
      {time.expired ? (
        <p style={{ ...s.expired, color: theme.primary }}>The day has arrived!</p>
      ) : (
        <div style={s.grid}>
          {units.map((u) => (
            <div key={u.label} style={{ ...s.unit, background: theme.cardBg, border: `1px solid ${theme.border}` }}>
              <span style={{ ...s.value, color: theme.primary }}>{String(u.value).padStart(2, "0")}</span>
              <span style={{ ...s.unitLabel, color: theme.accent }}>{u.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const s = {
  section: { padding: "3rem 1.5rem", textAlign: "center" as const },
  label: { margin: "0 0 1.5rem", fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase" as const },
  expired: { fontSize: "1.5rem", fontWeight: 300 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "0.75rem",
    maxWidth: "420px",
    margin: "0 auto",
  },
  unit: {
    borderRadius: "12px",
    padding: "1rem 0.5rem",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.25rem",
  },
  value: { fontSize: "2rem", fontWeight: 700, lineHeight: 1 },
  unitLabel: { fontSize: "0.625rem", letterSpacing: "0.1em", textTransform: "uppercase" as const },
} as const;
