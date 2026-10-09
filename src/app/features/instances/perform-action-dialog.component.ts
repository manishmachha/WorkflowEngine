import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvailableAction } from '../../data/actions.api';
import { FormRendererHostComponent } from '../../shared/forms/form-renderer-host.component';

@Component({
  selector: 'perform-action-dialog',
  standalone: true,
  imports: [FormsModule, FormRendererHostComponent],
  template: `
    @let a = action();
    @if (a) {
      <div
        class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
        (click)="cancelled.emit()"
      ></div>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          class="wfe-card-elevated w-[600px] max-w-full max-h-[85vh] flex flex-col pointer-events-auto wfe-fade"
        >
          <header
            class="px-5 py-4 border-b border-slate-100 flex items-start justify-between"
            [style.background]="theme().soft"
          >
            <div class="min-w-0">
              <div
                class="text-[10px] uppercase tracking-wider font-bold"
                [style.color]="theme().darker"
              >
                Perform Action
              </div>
              <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span
                  class="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm"
                  [style.background]="theme().base"
                >
                  <i class="bi bi-lightning-charge-fill"></i>
                </span>
                {{ a.transition.actionLabel || a.transition.actionKey }}
              </h2>
              <p class="text-xs text-slate-500">
                on step
                <span class="font-medium text-slate-700">{{ a.nodeLabel }}</span>
                <span class="mx-1 text-slate-300">·</span>
                key <code class="font-mono text-xs">{{ a.transition.actionKey }}</code>
              </p>
            </div>
            <button class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="cancelled.emit()">
              <i class="bi bi-x-lg"></i>
            </button>
          </header>

          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            @if (a.transition.formRef) {
              <div
                class="p-2.5 bg-indigo-50 rounded-md border border-indigo-100 text-xs text-indigo-800"
              >
                <i class="bi bi-file-earmark-text-fill mr-1"></i>
                This action collects data via the Amigo form
                <b>{{ a.transition.formRef.formId }}</b>
                (v{{ a.transition.formRef.formVersion }}). Submission triggers the transition.
              </div>
              <form-renderer-host
                [formId]="a.transition.formRef.formId"
                [formVersion]="a.transition.formRef.formVersion"
                (submitted)="submit($event)"
                (cancelled)="cancelled.emit()"
              />
            } @else {
              <label class="wfe-label">Remarks</label>
              <textarea
                class="wfe-textarea"
                rows="4"
                placeholder="Add remarks (visible in audit trail)"
                [(ngModel)]="remarks"
              ></textarea>
              <div class="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  class="wfe-btn wfe-btn-primary"
                  [style.background]="theme().base"
                  (click)="submit(undefined)"
                >
                  <i class="bi bi-check-lg"></i> Execute action
                </button>
                <button class="wfe-btn wfe-btn-ghost" (click)="cancelled.emit()">Cancel</button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class PerformActionDialogComponent {
  action = input<AvailableAction | null>(null);
  cancelled = output<void>();
  submitted = output<{ payload: Record<string, unknown> | undefined; remarks?: string }>();

  remarks = '';

  private palette = [
    { base: '#6366f1', darker: '#4338ca', soft: '#eef2ff' },
    { base: '#10b981', darker: '#047857', soft: '#d1fae5' },
    { base: '#ef4444', darker: '#b91c1c', soft: '#fee2e2' },
    { base: '#f59e0b', darker: '#b45309', soft: '#fef3c7' },
    { base: '#0ea5e9', darker: '#0369a1', soft: '#e0f2fe' },
    { base: '#a855f7', darker: '#7e22ce', soft: '#f3e8ff' },
    { base: '#14b8a6', darker: '#0f766e', soft: '#ccfbf1' },
    { base: '#ec4899', darker: '#be185d', soft: '#fce7f3' },
  ];

  theme = computed(() => {
    const k = this.action()?.transition.actionKey || '';
    let h = 0;
    for (let i = 0; i < k.length; i++) h = k.charCodeAt(i) + ((h << 5) - h);
    return this.palette[Math.abs(h) % this.palette.length];
  });

  submit(payload: Record<string, unknown> | undefined) {
    this.submitted.emit({ payload, remarks: this.remarks });
    this.remarks = '';
  }
}
