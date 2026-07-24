import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { ButtonDirective } from 'primeng/button';
import { TuiTextfieldComponent, TuiRoot } from '@taiga-ui/core';

@Component({
  imports: [RouterOutlet, NavbarComponent],
  selector: 'main-layout-root',
  standalone: true,
  templateUrl: './main-layout.html',
})
export default class MainLayout {}
