"use client";

import { useEffect, useState } from "react";

export interface TimeLeft {
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

/** Live countdown to `targetDate` (falling back to `eventDate`), ticking once a second. */
export function useCountdown(targetDate: string, eventDate: string): TimeLeft {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(targetDate, eventDate));
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(targetDate, eventDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate, eventDate]);
  return time;
}
