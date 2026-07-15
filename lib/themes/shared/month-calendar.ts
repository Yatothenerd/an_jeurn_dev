export interface MonthCalendar {
  year: number;
  month: number;
  day: number;
  monthName: string;
  /** Monday-first grid cells for the target date's month; `null` pads the
   *  leading empty days before the 1st. */
  cells: Array<number | null>;
}

/** Pure date math for a Monday-first month-grid countdown view, shared by
 *  every theme that renders a full-month calendar (the live ticking
 *  countdown itself stays theme-owned via `useCountdown`). */
export function getMonthCalendar(targetDate: string, eventDate: string): MonthCalendar {
  const d = new Date(targetDate || eventDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = d.toLocaleDateString("en-US", { month: "long" });
  const cells: Array<number | null> = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return { year, month, day, monthName, cells };
}
