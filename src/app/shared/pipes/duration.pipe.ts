import { Pipe, PipeTransform } from '@angular/core';
import { formatHoursDuration, formatMinutesDuration } from '../utils/duration-format.util';

/**
 * `{{ record.lateMinutes | duration }}` -> `11 mins`
 * `{{ record.totalHoursWorked | duration: 'hours' }}` -> `1 hr 35 mins`
 */
@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(value: number | null | undefined, unit: 'minutes' | 'hours' = 'minutes'): string {
    return unit === 'hours' ? formatHoursDuration(value) : formatMinutesDuration(value);
  }
}
