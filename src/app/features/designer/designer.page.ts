import { Component, HostListener, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DesignerStore } from './designer.store';
import { CanvasComponent } from './canvas/canvas.component';
import { PaletteComponent } from './palette/palette.component';
import { PropertiesPanelComponent } from './properties/properties-panel.component';

@Component({
  selector: 'designer-page',
  standalone: true,
  imports: [CanvasComponent, PaletteComponent, PropertiesPanelComponent, RouterLink],
  template: `
    <div class="flex flex-col h-full bg-slate-50">
      <div
        class="h-14 border-b border-slate-200 bg-white flex items-center px-4 gap-2 shrink-0 shadow-sm"
      >
        <a routerLink="/definitions" class="wfe-btn wfe-btn-ghost wfe-btn-icon">
          <i class="bi bi-arrow-left"></i>
        </a>
        <div class="min-w-0">
          <div class="text-sm font-semibold text-slate-800 truncate">
            {{ store.def()?.name || 'Loading…' }}
          </div>
          <div class="text-xs text-slate-400">
            v{{ store.def()?.version }} · {{ store.def()?.status }}
            @if (store.dirty()) {
              <span class="ml-1 text-amber-600">· unsaved</span>
            }
          </div>
        </div>
        <div class="flex-1"></div>
        <div class="flex items-center gap-1 border border-slate-200 rounded-md p-0.5 bg-slate-50">
          <button
            class="wfe-btn wfe-btn-ghost wfe-btn-icon"
            [disabled]="!store.canUndo()"
            (click)="store.undo()"
            title="Undo (Ctrl+Z)"
          >
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>
          <button
            class="wfe-btn wfe-btn-ghost wfe-btn-icon"
            [disabled]="!store.canRedo()"
            (click)="store.redo()"
            title="Redo (Ctrl+Shift+Z)"
          >
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
        <a
          class="wfe-btn wfe-btn-soft"
          [routerLink]="['/simulate', store.def()?.id, store.def()?.version]"
        >
          <i class="bi bi-lightning-charge"></i> Simulate
        </a>
        <button
          class="wfe-btn wfe-btn-outline"
          [disabled]="!store.dirty() || !store.isDraftVersion()"
          (click)="store.save()"
        >
          <i class="bi bi-save"></i> Save
        </button>
        <button
          class="wfe-btn wfe-btn-primary"
          [disabled]="!store.canPublish()"
          (click)="store.publish()"
          [title]="store.isDraftVersion() ? 'Publish draft' : 'Only draft versions can be published'"
        >
          <i class="bi bi-cloud-upload"></i> Publish
        </button>
      </div>

      @if (store.def() && !store.isDraftVersion()) {
        <div
          class="px-4 py-2 text-sm border-b border-amber-200 bg-amber-50 text-amber-900 flex items-center gap-2 shrink-0"
        >
          <i class="bi bi-lock-fill"></i>
          @if (store.def()?.status === 'retired') {
            This version is archived — read-only. Create a new draft in the workflow hub to edit or
            publish.
          } @else {
            This version is published — read-only. Create a new draft in the workflow hub before
            making changes.
          }
        </div>
      }

      <div class="flex flex-1 overflow-hidden">
        <div class="w-56 border-r border-slate-200 bg-white overflow-y-auto shrink-0">
          <designer-palette />
        </div>
        <div class="flex-1 relative bg-slate-50">
          <designer-canvas />
        </div>
        <div class="w-96 border-l border-slate-200 bg-white overflow-hidden shrink-0 flex flex-col">
          <designer-properties />
        </div>
      </div>

      <div class="h-40 border-t border-slate-200 bg-white shrink-0 overflow-y-auto">
        <div
          class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center gap-2"
        >
          <i class="bi bi-clipboard-check"></i>
          Validation
          <span class="wfe-chip" [class]="issueChip()">{{ store.issues().length }}</span>
        </div>
        @if (store.issues().length === 0) {
          <div class="p-4 text-sm text-emerald-600 flex items-center gap-2">
            <i class="bi bi-check-circle-fill"></i> Definition is valid and ready to publish.
          </div>
        }
        <ul class="text-sm divide-y divide-slate-100">
          @for (i of store.issues(); track i.code + (i.nodeId || i.transitionId || '')) {
            <li class="px-4 py-2 flex items-start gap-2">
              <i
                class="bi mt-0.5"
                [class.bi-x-circle-fill]="i.severity === 'error'"
                [class.text-red-600]="i.severity === 'error'"
                [class.bi-exclamation-triangle-fill]="i.severity === 'warn'"
                [class.text-amber-600]="i.severity === 'warn'"
                [class.bi-info-circle-fill]="i.severity === 'info'"
                [class.text-sky-600]="i.severity === 'info'"
              ></i>
              <span class="flex-1 text-slate-700">{{ i.message }}</span>
              <span class="text-xs text-slate-400 font-mono">{{ i.code }}</span>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  host: { class: 'block h-full' },
})
export class DesignerPage implements OnInit {
  id = input.required<string>();
  version = input.required<string>();
  store = inject(DesignerStore);

  ngOnInit() {
    this.store.load(this.id(), Number(this.version()));
  }

  issueChip() {
    const has = this.store.issues().some((i) => i.severity === 'error');
    if (has) return 'wfe-chip-danger';
    if (this.store.issues().length) return 'wfe-chip-warn';
    return 'wfe-chip-success';
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const ctrl = e.metaKey || e.ctrlKey;
    if (ctrl && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      this.store.undo();
    } else if (ctrl && (e.key === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      this.store.redo();
    } else if (ctrl && e.key === 's') {
      e.preventDefault();
      this.store.save();
    }
  }
}
