import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-dashboard-clock',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard-clock.html',
})
export class DashboardClock implements OnInit {
  private destroyRef = inject(DestroyRef);

  currentTime = signal(new Date());

  ngOnInit() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentTime.set(new Date());
      });
  }
}
