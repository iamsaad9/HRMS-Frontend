import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TuiButton, TuiDialogService } from '@taiga-ui/core';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiCardLarge } from '@taiga-ui/layout';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { ToastService } from '../../../../../core/services/toast.service';
import {
  LeaveAdjustmentLog,
  LeaveAdjustmentService,
  LeaveAllocationRow,
} from '../../service/leave-adjustment.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { LeaveRequestsService } from '../../../leave-management/service/leave-requests.service';
import {
  AdjustBalanceFormValue,
  AdjustBalanceModal,
} from '../../components/adjust-balance-modal/adjust-balance-modal';

@Component({
  selector: 'app-leave-adjustment-detail',
  standalone: true,
  imports: [DatePipe, TuiButton, TuiTable, TuiCardLarge, MainHeading],
  templateUrl: './leave-adjustment-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveAdjustmentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leaveAdjustmentService = inject(LeaveAdjustmentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly leaveTypesService = inject(LeaveRequestsService);
  private readonly dialogs = inject(TuiDialogService);
  private readonly toast = inject(ToastService);

  protected employeeId = signal<string>('');
  protected balances = signal<LeaveAllocationRow[]>([]);
  protected auditLog = signal<LeaveAdjustmentLog[]>([]);
  protected isLoading = signal(true);

  protected employeeName = computed(() => {
    const employee = (this.employeeService.allEmployees() ?? []).find((e) => e.id === this.employeeId());
    return employee?.fullName ?? this.employeeId();
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('employeeId');
    if (!id) return;
    this.employeeId.set(id);

    this.employeeService.getAllEmployees().subscribe();
    this.leaveTypesService.getAllLeaveTypes().subscribe();
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    const employeeId = this.employeeId();

    this.leaveAdjustmentService.getEmployeeBalances(employeeId).subscribe({
      next: (response) => this.balances.set(response.isSuccess && response.data ? response.data : []),
    });

    this.leaveAdjustmentService.getAdjustmentLog(employeeId).subscribe({
      next: (response) => {
        this.auditLog.set(response.isSuccess && response.data ? response.data : []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected adjustBalance(): void {
    this.dialogs
      .open<AdjustBalanceFormValue | null>(new PolymorpheusComponent(AdjustBalanceModal), {
        label: 'Adjust Balance',
        size: 'm',
        data: { employeeName: this.employeeName(), leaveTypes: this.leaveTypesService.leaveTypes() },
      })
      .subscribe((result) => {
        if (!result) return;

        this.leaveAdjustmentService
          .adjustBalance({
            employeeId: this.employeeId(),
            leaveTypeId: result.leaveTypeId,
            adjustmentDays: result.adjustmentDays,
            reason: result.reason,
          })
          .subscribe({
            next: (response) => {
              if (response.isSuccess) {
                this.toast.success('Leave balance adjusted successfully.', 'Saved');
                this.loadData();
              } else {
                this.toast.error(response.message || 'Could not adjust balance.', 'Save Failed');
              }
            },
            error: (err) => this.toast.error(err?.error?.message || 'Could not adjust balance.', 'Save Failed'),
          });
      });
  }
}
