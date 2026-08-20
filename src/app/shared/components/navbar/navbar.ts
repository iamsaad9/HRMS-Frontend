import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiTitle,
  TuiTextfieldComponent,
  TuiIcon,
} from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapperComponent, TuiStringifyContentPipe } from '@taiga-ui/kit';
import { DropDownItem, DropdownSelectorComponent } from '../dropdown-selector/dropdown-selector';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { TuiFilterByInputPipe, TuiInput, TuiSelectLike } from '@taiga-ui/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../core/services/theme.service';
import { TuiAvatar, TuiAvatarOutline } from '@taiga-ui/kit';
import { AuthService } from '../../../features/(public)/auth/services/auth.service';
import { DropdownItems } from '../../../core/config/navigation.config';
import { AttendanceService } from '../../../features/(private)/attendance/service/attendance.service';

interface ExampleAction {
  readonly icon: string;
  readonly description: string;
  readonly title: string;
  readonly route: string;
}

@Component({
  selector: 'app-navbar',
  imports: [
    FormsModule,
    TuiActiveZone,
    TuiChevron,
    TuiDataList,
    TuiObscured,
    TuiTitle,
    DropdownSelectorComponent,
    MatIcon,
    TuiTextfieldComponent,
    TuiChevron,
    TuiDropdown,
    TuiInput,
    TuiIcon,
    TuiAvatar,
    TuiAvatarOutline,
    RouterLink
  ],
  standalone: true,
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fixed z-50',
  },
})
export class NavbarComponent {
  protected readonly attendanceService = inject(AttendanceService);
  activeIndex = signal(-1);
  menuToggle = output<void>();

  protected readonly stringifyRoute = (item: DropDownItem): string => item.title;
  protected readonly actions: readonly ExampleAction[] = [
    {
      icon: 'add',
      title: 'Create Employee',
      description: 'Create and Employee',
      route: 'employee/new',
    },
    {
      icon: 'delete',
      title: 'Remove Employee',
      description: 'Delete and Employee',
      route: 'employee/all',
    },
    {
      icon: 'arrow_downward',
      title: 'Download Report',
      description: 'Download any report',
      route: 'reports/download',
    },
  ];

  protected readonly dropdownItems = DropdownItems;
  private readonly authService = inject(AuthService);
  protected readonly quickActionsOpen = signal(false);
  protected readonly userDropdownOpen = signal(false);
  protected readonly router = inject(Router);
  protected readonly navMenuOpen = signal(false);
  protected readonly selected = signal<ExampleAction | null>(null);
  protected readonly buttonLabel = computed(() => this.selected()?.title ?? 'Choose');
  protected readonly themeService = inject(ThemeService);
  protected readonly currentUser = this.authService.currentUser();
  private readonly userPermissions = computed(
    () => this.authService.currentUser()?.permissions ?? [],
  );
  protected readonly allowedDropDownItems = computed(() =>
    this.filterByPermission(this.dropdownItems, this.userPermissions()),
  );

  protected filterByPermission(items: DropDownItem[], permissions: string[]): DropDownItem[] {
    return items.reduce<DropDownItem[]>((acc, item) => {
      const hasOwnAccess = !item.permissions || permissions.includes(item.permissions);

      const filteredChildren = item.childItems
        ? this.filterByPermission(item.childItems, permissions)
        : undefined;

      const hasVisibleChildren = !!filteredChildren && filteredChildren.length > 0;

      if (hasOwnAccess || hasVisibleChildren) {
        acc.push({
          ...item,
          ...(item.childItems ? { childItems: filteredChildren } : {}),
        });
      }

      return acc;
    }, []);
  }

  protected openQuickAddOpen(): void {
    this.quickActionsOpen.update((open) => !open);
  }

  protected openUserDropDown(): void {
    this.userDropdownOpen.update((open) => !open);
  }

  protected openNavMenu(): void {
    this.navMenuOpen.update((open) => !open);
  }

  protected onObscured(obscured: boolean): void {
    if (obscured) {
      this.quickActionsOpen.set(false);
      this.navMenuOpen.set(false);
      this.userDropdownOpen.set(false);
    }
  }

  protected onActiveZone(active: boolean): void {
    if (!active) {
      this.quickActionsOpen.set(false);
      this.navMenuOpen.set(false);
      this.userDropdownOpen.set(false);
    }
  }

  protected onSelect(action: ExampleAction): void {
    this.selected.set(action);
    this.quickActionsOpen.set(false);
  }

  protected onLogout(): void {
    this.authService.logout().subscribe();
  }
}
