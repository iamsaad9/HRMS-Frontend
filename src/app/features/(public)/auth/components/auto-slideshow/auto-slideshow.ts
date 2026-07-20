import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auto-slideshow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auto-slideshow.html',
})
export class AutoSlideshowComponent implements OnInit, OnDestroy {
  @Input() interval = 3000;
  @Input() class = '';

  // 1. Convert to a Signal initialized at 0
  currentIndex = signal(0);
  private timerId: any;

  images = [
    '/images/slideshow/slide1.jpg',
    '/images/slideshow/slide2.jpg',
    '/images/slideshow/slide3.jpg',
    '/images/slideshow/slide4.jpg',
  ];

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      // 2. Use the .update() method to cycle the index cleanly
      this.currentIndex.update((prev) => (prev + 1) % this.images.length);
    }, this.interval);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}
