export type TrendDirection = 'up' | 'down' | 'neutral';

export interface KpiCard {
  id: string;
  title: string;
  value: string | number;
  changeLabel: string;
  trend: TrendDirection;
  subtext?: string;
  icon: 'users' | 'calendar-check' | 'dollar-sign' | 'clock';
}
