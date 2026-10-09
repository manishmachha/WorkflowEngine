import { Component, input, output } from '@angular/core';

@Component({
  selector: 'wfe-modal-shell',
  standalone: true,
  template: `
    <div
      class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
      (click)="dismiss.emit()"
      role="presentation"
    ></div>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title()"
    >
      <div
        class="wfe-card-elevated pointer-events-auto wfe-fade flex flex-col max-h-[85vh] w-full"
        [class]="sizeClass()"
        (click)="$event.stopPropagation()"
      >
        <header
          class="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0"
        >
          <div class="min-w-0">
            @if (title()) {
              <h2 class="text-lg font-semibold text-slate-900 truncate">{{ title() }}</h2>
            }
            @if (subtitle()) {
              <p class="text-xs text-slate-500 mt-0.5">{{ subtitle() }}</p>
            }
          </div>
          <button
            type="button"
            class="wfe-btn wfe-btn-ghost wfe-btn-icon shrink-0"
            (click)="dismiss.emit()"
            aria-label="Close"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </header>
        <div class="flex-1 overflow-y-auto p-5">
          <ng-content />
        </div>
        @if (showFooter()) {
          <footer class="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <ng-content select="[modalActions]" />
          </footer>
        }
      </div>
    </div>
  `,
})
export class ModalShellComponent {
  title = input<string>('');
  subtitle = input<string>('');
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  showFooter = input(false);
  dismiss = output<void>();

  sizeClass() {
    switch (this.size()) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-3xl';
      case 'xl':
        return 'max-w-5xl';
      default:
        return 'max-w-xl';
    }
  }
}
