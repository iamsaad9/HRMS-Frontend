import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { TuiToast } from '@taiga-ui/kit';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';

export interface ToastData {
  message: string;
  appearance: 'positive' | 'negative' | 'warning';
}

@Component({
  standalone: true,
  imports: [TuiToast],
  template: `
    <div
      tuiToast
      tuiTheme="dark"
      [iconStart]="
        context.data.appearance === 'positive' ? '@tui.circle-check' : '@tui.triangle-alert'
      "
      [style.background]="
        context.data.appearance === 'positive'
          ? 'var(--tui-status-positive)'
          : 'var(--tui-status-negative)'
      "
    >
      {{ context.data.message }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicToast {
  protected readonly context = inject<any>(POLYMORPHEUS_CONTEXT);
}
