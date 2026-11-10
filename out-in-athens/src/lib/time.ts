import type { Hours } from '@/data/types';

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type TimeWindow = 'now' | 'tonight' | 'weekend' | 'week' | 'twoWeeks';

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function windowRange(w: TimeWindow, now: Date): [Date, Date] {
  const today = startOfDay(now);
  switch (w) {
    case 'now':
      return [now, new Date(now.getTime() + 90 * 60_000)];
    case 'tonight': {
      const s = new Date(today);
      s.setHours(17, 0, 0, 0);
      const e = addDays(today, 1);
      e.setHours(3, 0, 0, 0);
      return [now > s ? now : s, e];
    }
    case 'weekend': {
      const dow = today.getDay();
      // Friday 5pm → Sunday midnight. If it's already the weekend, start now.
      const toFri = dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow;
      const fri = addDays(today, toFri);
      fri.setHours(17, 0, 0, 0);
      const sunEnd = addDays(fri, 3);
      sunEnd.setHours(0, 0, 0, 0);
      return [now > fri ? now : fri, sunEnd];
    }
    case 'week':
      return [now, addDays(today, 7)];
    case 'twoWeeks':
      return [now, addDays(today, 15)];
  }
}

/** Does [start,end] overlap the window? */
export function overlaps(start: Date, end: Date, range: [Date, Date]): boolean {
  return start < range[1] && end > range[0];
}

export function isLive(start: Date, end: Date, now: Date): boolean {
  return start <= now && end > now;
}

export function fmtTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m === 0 ? `${h}${ap}` : `${h}:${String(m).padStart(2, '0')}${ap}`;
}

export function fmtHour(h: number): string {
  const hh = ((Math.floor(h) % 24) + 24) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  if (hh === 0 && mm === 0) return 'midnight';
  if (hh === 12 && mm === 0) return 'noon';
  return fmtTime(d);
}

export function relativeDay(d: Date, now: Date): string {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return d.getHours() >= 17 ? 'Tonight' : 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return DAY_LONG[d.getDay()];
  return `${DAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function whenLabel(start: Date, end: Date, now: Date): string {
  if (isLive(start, end, now)) return `Happening now · til ${fmtTime(end)}`;
  const mins = Math.round((start.getTime() - now.getTime()) / 60_000);
  if (mins > 0 && mins < 90) return `Starts in ${mins} min`;
  return `${relativeDay(start, now)} · ${fmtTime(start)}`;
}

export function partOfDay(now: Date): string {
  const h = now.getHours();
  if (h < 5) return 'late night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

// Approximate sunrise / sunset for Athens in a given month (daylight hours).
const SUN: [number, number][] = [
  [7.6, 17.8], [7.3, 18.3], [7.8, 19.7], [7.1, 20.1], [6.6, 20.5], [6.4, 20.8],
  [6.6, 20.7], [6.9, 20.2], [7.2, 19.6], [7.6, 18.9], [7.0, 17.5], [7.4, 17.4],
];

/** Returns [open, close] in hours for the given date, or null if closed. */
export function hoursForDay(h: Hours, d: Date): [number, number] | null {
  if (h.kind === 'always') return [0, 24];
  if (h.kind === 'daylight') return SUN[d.getMonth()];
  return h.days[d.getDay()];
}

export function isOpenAt(h: Hours, d: Date): boolean {
  if (h.kind === 'always') return true;
  const hr = d.getHours() + d.getMinutes() / 60;
  const today = hoursForDay(h, d);
  if (today && hr >= today[0] && hr < Math.min(today[1], 24)) return true;
  // Spill-over from yesterday's late close (e.g. close = 26 → 2am).
  const y = addDays(d, -1);
  const yest = hoursForDay(h, y);
  if (yest && yest[1] > 24 && hr < yest[1] - 24) return true;
  return false;
}

export function hoursLabel(h: Hours, d: Date): string {
  if (h.kind === 'always') return 'Open 24/7';
  if (h.kind === 'daylight') return 'Dawn to dusk';
  const today = hoursForDay(h, d);
  if (!today) return 'Closed today';
  return `${fmtHour(today[0])}–${fmtHour(today[1])}`;
}

export function openStatus(h: Hours, now: Date): { open: boolean; label: string } {
  const open = isOpenAt(h, now);
  if (h.kind === 'always') return { open: true, label: 'Open 24/7' };
  const today = hoursForDay(h, now);
  if (open) {
    const hr = now.getHours() + now.getMinutes() / 60;
    let close = today && hr >= today[0] ? today[1] : (hoursForDay(h, addDays(now, -1))?.[1] ?? 24) - 24;
    if (h.kind === 'daylight') return { open: true, label: `Open til dusk (~${fmtHour(close)})` };
    return { open: true, label: `Open til ${fmtHour(close)}` };
  }
  if (today && now.getHours() < today[0]) return { open: false, label: `Opens ${fmtHour(today[0])}` };
  return { open: false, label: 'Closed now' };
}
