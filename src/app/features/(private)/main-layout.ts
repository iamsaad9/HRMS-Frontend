import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { ButtonDirective } from 'primeng/button';
import { TuiTextfieldComponent, TuiRoot } from '@taiga-ui/core';
import { Loader } from '../../shared/components/loader/loader';
import { AuthService } from '../(public)/auth/services/auth.service';
import { AttendanceService } from './attendance/service/attendance.service';
import { firstValueFrom, forkJoin } from 'rxjs';


@Component({
  imports: [RouterOutlet, NavbarComponent, Loader],
  selector: 'main-layout-root',
  standalone: true,
  templateUrl: './main-layout.html',
})
export default class MainLayout {

}