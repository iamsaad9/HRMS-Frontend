import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule} from '@angular/common';
import {   TuiAppearance } from '@taiga-ui/core';
import { TuiRingChart,  } from '@taiga-ui/addon-charts';
import { TuiAccordion,  TuiProgressCircle } from '@taiga-ui/kit';
import { FormsModule } from '@angular/forms';
import { TuiCard, TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { tuiSum } from '@taiga-ui/cdk';
import { TuiAmountPipe } from '@taiga-ui/addon-commerce';

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
  readonly attendanceValues = signal<number[]>([57, 8, 4, 3]);
  readonly labels = ['Present', 'Absent', 'Leave', 'WFH'];
  readonly headcountProgress = signal<number>(0.925);
  protected activeItemIndex = Number.NaN;
  protected readonly sum = tuiSum(...this.attendanceValues());
 
  expanded = true;


  protected index = Number.NaN;

  protected get label(): string {
    return (Number.isNaN(this.index) ? 'Total' : this.labels[this.index]) ?? '';
  }
}
