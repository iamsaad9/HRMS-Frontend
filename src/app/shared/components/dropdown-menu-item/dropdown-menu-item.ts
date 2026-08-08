import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { TuiDataList, TuiDropdown, TuiTitle } from '@taiga-ui/core';
import { MatIcon } from '@angular/material/icon';
import { DropDownItem } from '../dropdown-selector/dropdown-selector';

@Component({
  selector: 'app-dropdown-menu-item',
  standalone: true,
  imports: [TuiDropdown, TuiDataList, TuiTitle, MatIcon, DropdownMenuItem],
  templateUrl: './dropdown-menu-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownMenuItem {
  public readonly item = input.required<DropDownItem>();
  public readonly isMobile = input<boolean>(false);

  @Output() navigate = new EventEmitter<string | undefined>();

  protected onLeafClick(): void {
    this.navigate.emit(this.item().routeTo);
  }
}
