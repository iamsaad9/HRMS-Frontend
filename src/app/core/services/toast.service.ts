// import { inject, Injectable } from '@angular/core';
// import { TuiAlertService } from '@taiga-ui/core';
// import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
// import { DynamicToast, ToastData } from '../../shared/components/toast/DynamicToast';

// @Injectable({
//   providedIn: 'root',
// })
// export class ToastService {
//   // Note: Taiga UI v4 uses TuiAlertService for alert/toast popups
//   private readonly alerts = inject(TuiAlertService);

//   show(appearance: ToastData['appearance'], message: string, autoClose = 3000): void {
//     this.alerts
//       .open(new PolymorpheusComponent(DynamicToast), {
//         data: {
//           message,
//           appearance,
//         },
//         autoClose,
//       })
//       .subscribe();
//   }

//   positive(message: string, autoClose = 3000): void {
//     this.show('positive', message, autoClose);
//   }

//   negative(message: string, autoClose = 3000): void {
//     this.show('negative', message, autoClose);
//   }

//   warning(message: string, autoClose = 3000): void {
//     this.show('warning', message, autoClose);
//   }
// }

import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../../shared/custom-toast/toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', title?: string, duration = 4000): void {
    const id = crypto.randomUUID();
    const newToast: Toast = { id, message, title, type, duration };

    this.toasts.update((current) => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, title = 'Success', duration = 4000): void {
    this.show(message, 'success', title, duration);
  }

  error(message: string, title = 'Error', duration = 4000): void {
    this.show(message, 'error', title, duration);
  }

  warning(message: string, title = 'Warning', duration = 4000): void {
    this.show(message, 'warning', title, duration);
  }

  info(message: string, title = 'Information', duration = 4000): void {
    this.show(message, 'info', title, duration);
  }

  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
