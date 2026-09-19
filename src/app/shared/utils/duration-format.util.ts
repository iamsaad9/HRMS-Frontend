/**
 * Formats a raw minutes value into a clean, human-readable duration string, instead of a
 * granular decimal (e.g. `11.35 min`):
 * - Under 60 minutes: whole minutes only, e.g. `11 mins`.
 * - 60 minutes or more: split into hours and minutes, e.g. `1 hr 35 mins` (not `1.58 hrs`).
 */
export function formatMinutesDuration(totalMinutes: number | null | undefined): string {
  const minutes = Math.round(totalMinutes ?? 0);
  if (minutes <= 0) return '0 mins';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} ${remainingMinutes === 1 ? 'min' : 'mins'}`;
  }

  const hoursLabel = `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  return remainingMinutes === 0
    ? hoursLabel
    : `${hoursLabel} ${remainingMinutes} ${remainingMinutes === 1 ? 'min' : 'mins'}`;
}

/** Same formatting as {@link formatMinutesDuration}, starting from a decimal-hours value (e.g. totalHoursWorked). */
export function formatHoursDuration(totalHours: number | null | undefined): string {
  return formatMinutesDuration((totalHours ?? 0) * 60);
}
