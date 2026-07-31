import { Component, computed, inject, input, model, signal } from '@angular/core';
import { ChangeDetectionStrategy, output } from '@angular/core';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import { TuiButton, TuiDataList, TuiDropdown, TuiTitle } from '@taiga-ui/core';
import { TuiChevron } from '@taiga-ui/kit';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

// export interface DropdownAction {
//   title: string;
//   description?: string;
// }

export interface DropDownItem {
  icon?: string;
  title: string;
  description: string;
  routeTo?: string;
  childItems?: DropDownItem[];
}

@Component({
  selector: 'app-dropdown-selector',
  standalone: true,
  imports: [TuiDropdown, TuiDataList, TuiActiveZone, TuiObscured, RouterLink, MatIcon],
  templateUrl: './dropdown-selector.html',
})
export class DropdownSelectorComponent {
  protected readonly open = signal(false);
  private readonly router = inject(Router);

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
    this.router.navigate([route]);
  }

  public readonly dropDownItem = input.required<DropDownItem>();
  public readonly isMobile = input<boolean>();
}
