import {
  Component,
  inject,
  Input,
  Output,
  EventEmitter,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../../../../core/services/toast.service';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../(public)/auth/services/auth.service';

@Component({
  selector: 'app-profile-picture-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="relative size-16 shrink-0">
      @if (_currentPictureUrl()) {
        <img
          [src]="_currentPictureUrl()"
          alt="Profile"
          class="size-16 rounded-full object-cover border border-(--theme1)/50"
        />
      } @else {
        <div
          class="size-16 rounded-full bg-(--theme1)/15 border border-(--theme1)/25 flex items-center justify-center text-xl font-semibold text-(--theme1)"
        >
          {{ initials }}
        </div>
      }

      @if (isUploading()) {
        <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
          <span
            class="size-5 rounded-full border-2 border-white border-t-transparent animate-spin"
          ></span>
        </div>
      }

      @if (canEdit) {
        <label
          class="absolute -bottom-1 -right-1 bg-(--theme1) hover:bg-(--theme1)/80 text-white rounded-full p-1 px-2 cursor-pointer transition shadow"
          title="Change profile picture"
        >
          <mat-icon class="text-sm!" style="font-size: 14px; width: 14px; height: 14px;"
            >camera_alt</mat-icon
          >
          <input
            type="file"
            #fileInput
            (change)="onFileSelected($event)"
            accept="image/jpeg,image/png"
            hidden
          />
        </label>
      }
    </div>
  `,
  styles: [],
})
export class ProfilePictureUploadComponent {
  @Input() employeeId!: string;
  @Input() set currentPictureUrl(value: string | null | WritableSignal<string | null>) {
    if (typeof value === 'string' || value === null) {
      this._currentPictureUrl.set(value);
    } else {
      this._currentPictureUrl.set(value());
    }
  }
  @Input() initials: string = '';
  /** Whether the camera overlay (upload control) should render at all. */
  @Input() canEdit: boolean = true;
  @Output() pictureUploaded = new EventEmitter<string>();

  private employeeService = inject(EmployeeService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  _currentPictureUrl = signal<string | null>(null);
  isUploading = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.toast.error('File size exceeds 2MB limit', 'Upload Failed');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.toast.error('Only JPG and PNG files are allowed', 'Invalid Format');
      return;
    }

    this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    this.isUploading.set(true);

    this.employeeService.uploadProfilePicture(this.employeeId, file).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this._currentPictureUrl.set(response.data.pictureUrl);
          this.pictureUploaded.emit(response.data.pictureUrl);
          this.toast.success('Profile picture uploaded successfully', 'Success');

          // If uploading our own picture, refresh the navbar/dashboard immediately instead of
          // waiting on a full /me refetch (login/refresh) to pick up the change.
          if (this.employeeId === this.authService.currentUser()?.employeeInfo?.id) {
            this.authService.updateOwnProfilePicture(response.data.pictureUrl);
          }
        } else {
          this.toast.error(response.message || 'Upload failed', 'Error');
        }
        this.isUploading.set(false);
      },
      error: (err: any) => {
        this.isUploading.set(false);
        this.toast.error(err.error?.message || 'Failed to upload image', 'Error');
      },
    });
  }
}
