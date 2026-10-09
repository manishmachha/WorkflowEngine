import { Component } from '@angular/core';
import { NODE_KINDS, NodeKind } from '../../../domain/definition';

@Component({
  selector: 'designer-palette',
  standalone: true,
  template: `
    <div class="p-3">
      <h3 class="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3">
        Node Palette
      </h3>
      <div class="space-y-1.5">
        @for (k of kinds; track k.kind) {
          <div
            class="group flex items-center gap-2.5 px-2.5 py-2 rounded-md border border-slate-200 bg-white cursor-grab hover:border-indigo-300 hover:shadow-sm transition"
            draggable="true"
            (dragstart)="onDragStart($event, k.kind)"
            [title]="'Drag to add ' + k.label"
          >
            <span
              class="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              [style.background]="k.color + '1A'"
            >
              <i class="bi {{ k.icon }} text-sm" [style.color]="k.color"></i>
            </span>
            <span class="text-xs font-medium text-slate-700">{{ k.label }}</span>
            <i class="bi bi-grip-vertical text-slate-300 ml-auto text-xs"></i>
          </div>
        }
      </div>
      <div class="mt-4 p-3 rounded-md bg-indigo-50/60 border border-indigo-100">
        <p class="text-[11px] text-indigo-700 leading-relaxed">
          <i class="bi bi-info-circle mr-1"></i>
          Drag onto canvas to add. <kbd class="px-1 bg-white rounded text-[10px]">Ctrl</kbd>+
          <kbd class="px-1 bg-white rounded text-[10px]">Z</kbd> to undo,
          <kbd class="px-1 bg-white rounded text-[10px]">Ctrl</kbd>+
          <kbd class="px-1 bg-white rounded text-[10px]">S</kbd> to save.
        </p>
      </div>
    </div>
  `,
})
export class PaletteComponent {
  kinds = NODE_KINDS;
  onDragStart(e: DragEvent, kind: NodeKind) {
    e.dataTransfer?.setData('application/x-wfe-node', kind);
    e.dataTransfer!.effectAllowed = 'copy';
  }
}
