import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loader',
  imports: [],
  template: `
    @if (loadingService.isLoading()) {
      <div class="loader-overlay backdrop-blur-sm">
        <span class="loader"></span>
      </div>
    }
  `,
  styles: [
    `
      .loader {
        --size: 1px;

        width: calc(48 * var(--size));
        height: calc(48 * var(--size));
        border-radius: 50%;
        display: inline-block;
        border-top: calc(4 * var(--size)) solid var(--theme1);
        border-right: calc(4 * var(--size)) solid transparent;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
      }
      .loader::after {
        content: '';
        box-sizing: border-box;
        position: absolute;
        left: 0;
        top: 0;
        width: calc(48 * var(--size));
        height: calc(48 * var(--size));
        border-radius: 50%;
        border-bottom: calc(4 * var(--size)) solid var(--theme2);
        border-left: calc(4 * var(--size)) solid transparent;
      }
      @keyframes rotation {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 40;
      }
      .spinner {
        width: 48px;
        height: 48px;
        border: 5px solid #fff;
        border-bottom-color: #007bff;
        border-radius: 50%;
        animation: rotation 1s linear infinite;
      }
      @keyframes rotation {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  styleUrl: './loader.css',
})
export class Loader {
  protected loadingService = inject(LoadingService);
}
