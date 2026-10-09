import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'form-renderer-host',
  standalone: true,
  template: '<div class="p-4 border border-dashed border-slate-300 rounded text-slate-500 text-center text-sm">Form backend not yet integrated</div>'
})
export class FormRendererHostComponent {
  @Input() formId?: string;
  @Input() formVersion?: number;
  @Input() initialValue?: Record<string, unknown>;
  @Output() submitted = new EventEmitter<Record<string, unknown>>();
  @Output() cancel = new EventEmitter<void>();
}
