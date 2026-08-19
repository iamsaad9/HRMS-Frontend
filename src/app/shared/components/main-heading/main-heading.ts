import { Component,  inject,  input } from '@angular/core';
import { Router } from '@angular/router';
import { TuiIcon } from "@taiga-ui/core";
import { Location } from '@angular/common';

@Component({
  selector: 'app-main-heading',
  imports: [TuiIcon,],
  templateUrl: './main-heading.html',
})
export class MainHeading {
  title = input.required<string>();
  description = input<string>();
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
