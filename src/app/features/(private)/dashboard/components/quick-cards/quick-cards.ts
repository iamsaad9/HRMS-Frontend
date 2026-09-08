import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule} from '@angular/common';
import {   TuiAppearance } from '@taiga-ui/core';
import { TuiRingChart,  } from '@taiga-ui/addon-charts';
import { TuiAccordion,  TuiProgressCircle } from '@taiga-ui/kit';
import { FormsModule } from '@angular/forms';
import { TuiCard, TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { tuiSum } from '@taiga-ui/cdk';
import { TuiAmountPipe } from '@taiga-ui/addon-commerce';
import { DashboardService } from '../../service/dashboard.service';

@Component({
  selector: 'app-quick-cards',
  standalone: true,
  imports: [
    TuiAmountPipe,
    CommonModule,
    TuiRingChart,
    TuiCardLarge,
    TuiProgressCircle,
    FormsModule,
    TuiHeader,
    TuiCard,
    TuiAccordion,
    TuiAppearance,
  ],
  templateUrl: './quick-cards.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickCards {
  private readonly dashboardService = inject(DashboardService);
  protected readonly cards = computed(() => this.dashboardService.data()?.cards ?? null);

  protected activeItemIndex = Number.NaN;
  expanded = true;

  protected index = Number.NaN;
}
