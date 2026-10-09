import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DefinitionsApi } from '../../data/definitions.api';
import { WorkflowDefinition, Transition } from '../../domain/definition';
import { evaluate, emptyLogical, ExpressionNode } from '../../domain/rules';
import { ExpressionBuilderComponent } from '../../shared/rules/expression-builder.component';

@Component({
  selector: 'rule-tester-page',
  standalone: true,
  imports: [FormsModule, ExpressionBuilderComponent],
  template: `
    <div class="wfe-page">
      <h1 class="wfe-page-title">Rule Tester</h1>
      <div class="grid grid-cols-2 gap-4">
        <div class="wfe-card p-4">
          <label class="wfe-label">Definition</label>
          <select class="wfe-input mb-2" [ngModel]="selectedId()" (ngModelChange)="pickDef($event)">
            <option value="">— pick —</option>
            @for (d of defs(); track d.id + d.version) {
              <option [value]="d.id + '::' + d.version">{{ d.name }} v{{ d.version }}</option>
            }
          </select>
          <label class="wfe-label">Case data (JSON)</label>
          <textarea class="wfe-input font-mono text-xs" rows="10" [ngModel]="scopeJson()" (ngModelChange)="scopeJson.set($event)"></textarea>
          <p class="text-xs text-gray-400 mt-1">Simulated form + workflow variable scope.</p>
        </div>
        <div class="wfe-card p-4">
          <h2 class="font-semibold mb-2">Transitions Evaluated</h2>
          @if (!def()) {
            <div class="text-xs text-gray-400">Pick a definition to see conditions.</div>
          }
          @for (t of transitions(); track t.id) {
            <div class="border-t py-2 flex items-center gap-2 text-sm">
              <span class="wfe-chip" [class.bg-emerald-100]="results()[t.id]" [class.text-emerald-700]="results()[t.id]" [class.bg-red-100]="!results()[t.id]" [class.text-red-700]="!results()[t.id]">
                {{ results()[t.id] ? 'MATCH' : 'skip' }}
              </span>
              <span class="font-mono text-xs">{{ nameFor(t.from) }} → {{ nameFor(t.to) }}</span>
              @if (t.isDefault) {
                <span class="wfe-chip bg-gray-100 text-gray-600">default</span>
              }
            </div>
          }
          <h3 class="text-xs font-semibold text-gray-500 mt-4 mb-2 uppercase">Ad-hoc expression</h3>
          <expression-builder [value]="adhoc()" [fields]="fieldNames()" (valueChange)="adhoc.set($event)" />
          <div class="text-sm mt-2">
            Result: <b [class.text-emerald-700]="adhocResult()" [class.text-red-700]="!adhocResult()">{{ adhocResult() ? 'true' : 'false' }}</b>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RuleTesterPage implements OnInit {
  private api = inject(DefinitionsApi);
  defs = signal<WorkflowDefinition[]>([]);
  selectedId = signal('');
  def = signal<WorkflowDefinition | null>(null);
  scopeJson = signal('{\n  "severity": "high",\n  "amount": 75000\n}');
  adhoc = signal<ExpressionNode>(emptyLogical('AND'));

  transitions = computed(() => this.def()?.transitions ?? []);

  scope = computed(() => {
    try {
      return JSON.parse(this.scopeJson());
    } catch {
      return {};
    }
  });

  results = computed(() => {
    const out: Record<string, boolean> = {};
    for (const t of this.transitions()) out[t.id] = evaluate(t.condition, this.scope());
    return out;
  });

  adhocResult = computed(() => evaluate(this.adhoc(), this.scope()));

  fieldNames = computed(() => Object.keys(this.scope() ?? {}));

  ngOnInit() {
    this.api.list().subscribe((v) => this.defs.set(v));
  }

  pickDef(v: string) {
    this.selectedId.set(v);
    const [id, ver] = v.split('::');
    if (!id) {
      this.def.set(null);
      return;
    }
    this.api.get(id, Number(ver)).subscribe((d) => this.def.set(d ?? null));
  }

  nameFor(id: string): string {
    return this.def()?.nodes.find((n) => n.id === id)?.label ?? id;
  }
}
