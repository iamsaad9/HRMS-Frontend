import { Component, input } from '@angular/core';

@Component({
  selector: 'app-main-heading',
  imports: [],
  templateUrl: './main-heading.html',
})
export class MainHeading {
  title = input.required<string>();
}
