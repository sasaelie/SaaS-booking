import { TIME } from '../../config/constants';
export function validDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}
export function addMonthsClamped(date: Date, months: number): Date {
  const next = new Date(date);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const last = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, last));
  return next;
}
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * TIME.DAY_MS);
}
