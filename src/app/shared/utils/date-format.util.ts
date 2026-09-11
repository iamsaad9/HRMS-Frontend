/**
 * `tuiInputDate`, bound directly to a plain string ngModel, displays/emits the locale-formatted
 * "dd.mm.yyyy" text rather than an ISO string. These helpers convert at that boundary so the
 * rest of the app (HTTP params, date-range math, backend DateOnly binding) can keep working in
 * plain ISO "yyyy-MM-dd" throughout.
 */

/** Parses a "dd.mm.yyyy" (or already-ISO) string into a real Date, or null if unparseable. */
export function parseDisplayDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (match) {
    const [, day, month, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const iso = new Date(value);
  return isNaN(iso.getTime()) ? null : iso;
}

/** "dd.mm.yyyy" (or ISO) -> ISO "yyyy-MM-dd". Returns the input unchanged if unparseable. */
export function toIsoDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = parseDisplayDate(value);
  if (!date) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** ISO "yyyy-MM-dd" -> "dd.mm.yyyy", for feeding a stored ISO value back into a tuiInputDate. */
export function isoToDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}
