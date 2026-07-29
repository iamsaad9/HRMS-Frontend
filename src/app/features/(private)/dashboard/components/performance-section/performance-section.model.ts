import { TuiPoint } from '@taiga-ui/core';

export interface PerformanceMetric {
  title: string;
  score: number; // e.g., 94%
  points: readonly TuiPoint[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: 'online' | 'busy' | 'leave';
  attendanceRate: string;
}
