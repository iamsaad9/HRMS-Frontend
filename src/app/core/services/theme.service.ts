import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'app_theme';

  readonly currentTheme = signal<AppTheme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, this.currentTheme());
    });
  }

  toggleTheme(): void {
    this.currentTheme.update((prev) => (prev === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
  }

  private getInitialTheme(): AppTheme {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as AppTheme | null;

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
