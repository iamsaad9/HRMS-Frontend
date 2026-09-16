import { Component, inject, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { TuiButton } from '@taiga-ui/core';
import { ToastService } from '../../../../../../core/services/toast.service';

@Component({
  selector: 'app-profile-picture-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, TuiButton],
  template: `
    <div class="flex flex-col gap-3 p-4 rounded-lg bg-(--background_light)/50 border border-(--secondary)/20">
      <div class="flex items-center gap-3">
        <!-- Current Picture or Initials -->
        <div class="relative">
          @if (currentPictureUrl()) {
          <img [src]="currentPictureUrl()" alt="Profile"
            class="size-20 rounded-full object-cover border-2 border-(--theme1)">
          } @else {
          <div class="size-20 rounded-full bg-(--theme1)/20 border-2 border-(--theme1)/50 flex items-center justify-center text-2xl font-semibold text-(--theme1)">
            {{ initials }}
          </div>
          }

          <!-- Upload overlay button -->
          <label class="absolute bottom-0 right-0 bg-(--theme1) hover:bg-(--theme1)/80 text-white rounded-full p-2 cursor-pointer transition">
            <mat-icon class="text-sm">camera_alt</mat-icon>
            <input type="file" #fileInput (change)="onFileSelected($event)"
              accept="image/jpeg,image/png" hidden />
          </label>
        </div>

        <!-- Upload Info -->
        <div class="flex-1">
          <p class="text-sm font-medium text-(--primary) m-0">Upload Profile Picture</p>
          <p class="text-xs text-(--primary)/60 m-0">JPG or PNG • Max 2MB</p>
          <p class="text-xs text-(--primary)/50 m-0 mt-1">{{ uploadStatus() }}</p>
        </div>
      </div>

      <!-- Upload Progress -->
      @if (isUploading()) {
      <div class="w-full bg-(--primary)/10 rounded h-1">
        <div class="bg-(--theme1) h-full rounded animate-pulse w-1/2"></div>
      </div>
      }
    </div>
  `,
  styles: []
})
export class ProfilePictureUploadComponent {
  @Input() employeeId!: string;
  @Input() currentPictureUrl = signal<string | null>(null);
  @Input() initials: string = '';
  @Output() pictureUploaded = new EventEmitter<string>();

  private http = inject(HttpClient);
  private toast = inject(ToastService);

  isUploading = signal(false);
  uploadStatus = signal('Click camera icon to upload');

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

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
    this.uploadStatus.set('Uploading...');

    const formData = new FormData();
    formData.append('file', file);

    this.http
      .post<any>(`/api/FileUpload/upload-profile-picture/${this.employeeId}`, formData)
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            const fullUrl = this.getFullImageUrl(response.data.pictureUrl);
            this.currentPictureUrl.set(fullUrl);
            this.pictureUploaded.emit(response.data.pictureUrl);
            this.uploadStatus.set('Uploaded successfully');
            this.toast.success('Profile picture uploaded successfully', 'Success');
          } else {
            this.uploadStatus.set('Upload failed');
            this.toast.error(response.message || 'Upload failed', 'Error');
          }
          this.isUploading.set(false);
        },
        error: (err) => {
          this.uploadStatus.set('Upload failed');
          this.isUploading.set(false);
          this.toast.error(err.error?.message || 'Failed to upload image', 'Error');
        }
      });
  }

  private getFullImageUrl(relativePath: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${relativePath}`;
  }
}
