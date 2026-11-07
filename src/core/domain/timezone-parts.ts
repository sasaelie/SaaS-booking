import { TIME } from '../../config/constants';
export function localParts(date: Date, timeZone: string): readonly number[] {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, Number(part.value)]));
  return ['year', 'month', 'day', 'hour', 'minute', 'second'].map(
    (part) => values.get(part as Intl.DateTimeFormatPartTypes) ?? NaN,
  );
}
export function offsetAt(timestamp: number, timeZone: string): number {
  const [year = NaN, month = NaN, day = NaN, hour = NaN, minute = NaN, second = NaN] = localParts(
    new Date(timestamp),
    timeZone,
  );
  return Date.UTC(year, month - 1, day, hour, minute, second) - timestamp;
}
export function possibleInstants(naive: number, timeZone: string): readonly number[] {
  const offsets = new Set(
    [-TIME.DAY_MS, 0, TIME.DAY_MS].map((delta) => offsetAt(naive + delta, timeZone)),
  );
  return [...offsets]
    .map((offset) => naive - offset)
    .filter((candidate) => candidate + offsetAt(candidate, timeZone) === naive);
}
