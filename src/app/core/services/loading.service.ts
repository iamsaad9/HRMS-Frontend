// loading.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private document = inject(DOCUMENT);
  readonly isLoading = signal<boolean>(false);

  showLoading(): void {
    this.isLoading.set(true);
    this.toggleScroll(true);
  }

  stopLoading(): void {
    this.isLoading.set(false);
    this.toggleScroll(false);
  }

  private toggleScroll(isLocked: boolean): void {
    const body = this.document.body;
    if (isLocked) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = '';
    }
  }
}
