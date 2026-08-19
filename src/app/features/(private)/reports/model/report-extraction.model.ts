export type ReportKey = 'attendance-history' | 'employee-directory';

export interface ReportDefinition {
  key: ReportKey;
  title: string;
  description: string;
  icon: string;
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    key: 'attendance-history',
    title: 'Attendance History',
    description: 'Daily attendance records, statuses, work locations, and exceptions per employee.',
    icon: '@tui.calendar-check',
  },
  {
    key: 'employee-directory',
    title: 'Employee Directory',
    description: 'Full employee roster with department, role, and status.',
    icon: '@tui.users',
  },
];