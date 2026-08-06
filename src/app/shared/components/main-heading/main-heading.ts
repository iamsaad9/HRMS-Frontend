import { Component, Input, input, signal } from '@angular/core';

@Component({
  selector: 'app-main-heading',
  imports: [],
  templateUrl: './main-heading.html',
})
export class MainHeading {
  title = input.required<string>();
  description = input<string>();
}
