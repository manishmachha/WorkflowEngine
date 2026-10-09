import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 z-[100] space-y-2 w-80">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="wfe-card p-3 flex items-start gap-2 border-l-4"
          [class.border-red-500]="t.level === 'error'"
          [class.border-amber-500]="t.level === 'warn'"
          [class.border-emerald-500]="t.level === 'success'"
          [class.border-sky-500]="t.level === 'info'"
        >
          <i
            class="bi mt-0.5"
            [class.bi-check-circle]="t.level === 'success'"
            [class.bi-exclamation-triangle]="t.level === 'warn'"
            [class.bi-x-circle]="t.level === 'error'"
            [class.bi-info-circle]="t.level === 'info'"
          ></i>
          <div class="flex-1 text-sm">{{ t.message }}</div>
          <button class="text-gray-400 hover:text-gray-700" (click)="toast.dismiss(t.id)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  toast = inject(ToastService);
}
