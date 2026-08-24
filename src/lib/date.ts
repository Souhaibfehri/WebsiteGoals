/** ISO date (yyyy-mm-dd) for "today", in local time. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(fromIso: string, toIsoDateStr: string): number {
  const from = new Date(fromIso + 'T00:00:00');
  const to = new Date(toIsoDateStr + 'T00:00:00');
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function isSameIsoWeek(aIso: string, bIso: string): boolean {
  const a = new Date(aIso + 'T00:00:00');
  const b = new Date(bIso + 'T00:00:00');
  const aMonday = startOfIsoWeek(a);
  const bMonday = startOfIsoWeek(b);
  return aMonday.getTime() === bMonday.getTime();
}

function startOfIsoWeek(d: Date): Date {
  const day = d.getDay() === 0 ? 7 : d.getDay(); // Mon=1..Sun=7
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
