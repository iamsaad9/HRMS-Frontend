import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiDialogService, TuiRoot } from '@taiga-ui/core';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './features/(public)/auth/services/auth.service';
import { InactivityDialogComponent } from './shared/components/inactivity-dialogue/inactivty-dialogue';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { InactivityService } from './core/services/inactivity.service';
import { ToastContainerComponent } from './shared/custom-toast/toast';

@Component({
  imports: [RouterOutlet, TuiRoot, ToastContainerComponent],
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
})
export default class App {
  protected readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly inactivityService = inject(InactivityService);
  private readonly dialogs = inject(TuiDialogService);

  constructor() {
    // Watch login state signal: Start/stop inactivity watcher accordingly
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.inactivityService.startMonitoring();
      } else {
        this.inactivityService.stopMonitoring();
      }
    });

    // Reactively open the Taiga UI modal when the warning state trips
    effect(() => {
      if (this.inactivityService.isWarningOpen()) {
        this.dialogs
          .open(new PolymorpheusComponent(InactivityDialogComponent), {
            dismissible: false,
            closable: false,
            size: 's',
          })
          .subscribe();
      }
    });
  }
}
