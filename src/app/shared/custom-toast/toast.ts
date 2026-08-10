import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { ToastType } from './toast.model';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgClass],
  styles: [`
    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(1rem) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .animate-toast-in {
      animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `],
  template: `
    <div
      class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto animate-toast-in flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200"
          [ngClass]="getStyles(toast.type)"
        >
          <!-- Dynamic Status Icon -->
          <div class="shrink-0 mt-0.5">
            @switch (toast.type) {
              @case ('success') {
                <svg
                  class="w-5 h-5 text-(--success)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              @case ('error') {
                <svg
                  class="w-5 h-5 text-rose-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              @case ('warning') {
                <svg
                  class="w-5 h-5 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              }
              @default {
                <svg
                  class="w-5 h-5 text-sky-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <div class="flex-1">
            @if (toast.title) {
              <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ toast.title }}
              </h4>
            }
            <p class="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            (click)="toastService.dismiss(toast.id)"
            class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg p-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected getStyles(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800';
      case 'error':
        return 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800';
      case 'warning':
        return 'bg-amber-50/90 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800';
      case 'info':
      default:
        return 'bg-sky-50/90 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800';
    }
  }
}