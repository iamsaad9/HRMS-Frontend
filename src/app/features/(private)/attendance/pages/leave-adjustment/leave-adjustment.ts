import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiCardLarge } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { LeaveAdjustmentService, LeaveAllocationRow } from '../../service/leave-adjustment.service';
import { EmployeeService } from '../../../employees/services/employee.service';

interface EmployeeBalanceSummary {
  employeeId: string;
  employeeName: string;
  staffNo: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
}

@Component({
  selector: 'app-leave-adjustment',
  standalone: true,
  imports: [TuiButton, TuiTable, TuiCardLarge, MainHeading],
  templateUrl: './leave-adjustment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveAdjustment implements OnInit {
  private readonly leaveAdjustmentService = inject(LeaveAdjustmentService);
  private readonly employeeService = inject(EmployeeService);
  protected readonly router = inject(Router);

  protected rows = signal<LeaveAllocationRow[]>([]);
  protected isLoading = signal(true);

  protected summaries = computed<EmployeeBalanceSummary[]>(() => {
    const employeesById = new Map((this.employeeService.allEmployees() ?? []).map((e) => [e.id, e]));
    const byEmployee = new Map<string, LeaveAllocationRow[]>();

    for (const row of this.rows()) {
      const list = byEmployee.get(row.employeeId) ?? [];
      list.push(row);
      byEmployee.set(row.employeeId, list);
    }

    return Array.from(byEmployee.entries()).map(([employeeId, rows]) => {
      const employee = employeesById.get(employeeId);
      return {
        employeeId,
        employeeName: employee?.fullName ?? employeeId,
        staffNo: employee?.staffNo ?? '—',
        totalAllocated: rows.reduce((sum, r) => sum + r.allocatedDays + r.adjustedDays, 0),
        totalUsed: rows.reduce((sum, r) => sum + r.usedDays, 0),
        totalRemaining: rows.reduce((sum, r) => sum + r.remainingBalance, 0),
      };
    });
  });

  ngOnInit(): void {
    this.employeeService.getAllEmployees().subscribe();
    this.leaveAdjustmentService.getAllBalances().subscribe({
      next: (response) => {
        this.rows.set(response.isSuccess && response.data ? response.data : []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected viewDetails(employeeId: string): void {
    this.router.navigate(['/schedule/leave-adjustment', employeeId]);
  }
}
