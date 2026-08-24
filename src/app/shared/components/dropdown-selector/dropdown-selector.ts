import {
  Component,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
} from '@angular/core';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import { TuiDataList, TuiDropdown  } from '@taiga-ui/core';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

export interface DropDownItem {
  id: string;
  icon?: string;
  title: string;
  description: string;
  routeTo?: string;
  category: string;
  childItems?: DropDownItem[];
  tags?: string[];
  permission?: string | string[];
}

@Component({
  selector: 'app-dropdown-selector',
  standalone: true,
  imports: [TuiDropdown, TuiDataList, TuiActiveZone, TuiObscured, MatIcon],
  templateUrl: './dropdown-selector.html',
})
export class DropdownSelectorComponent {
  protected readonly open = signal(false);
  private readonly router = inject(Router);
  public readonly dropDownItem = input.required<DropDownItem>();
  public readonly isMobile = input<boolean>();
  @Output() closeMobile = new EventEmitter<void>();

  protected toggleDropdown(): void {
    this.open.update((isOpen) => !isOpen);
  }

  protected onObscured(obscured: boolean): void {
    if (obscured) {
      this.open.set(false);
    }
  }

  protected onActiveZone(active: boolean): void {
    if (!active) {
      this.open.set(false);
    }
  }

  protected navigateTo(route: string | undefined): void {
    this.open.set(false);
    this.closeMobile.emit();
    this.router.navigate([route]);
  }
}
