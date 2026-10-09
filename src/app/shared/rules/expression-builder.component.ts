import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ComparisonExpr,
  ComparisonOperator,
  ExpressionNode,
  LogicalExpr,
  cmp,
  emptyLogical,
} from '../../domain/rules';

@Component({
  selector: 'expression-builder',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="wfe-card p-3 text-sm">
      @if (value(); as v) {
        <ng-container>
          @if (v.kind === 'logical') {
            @let lv = $any(v);
            <div class="flex items-center gap-2 mb-2">
              <select
                class="wfe-input py-1 text-xs w-24"
                [ngModel]="lv.operator"
                (ngModelChange)="setLogicalOp($event)"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
                <option value="NOT">NOT</option>
              </select>
              <button class="wfe-btn-ghost text-xs" (click)="addComparison()">
                + condition
              </button>
              <button class="wfe-btn-ghost text-xs" (click)="addGroup()">+ group</button>
            </div>
            <div class="pl-3 border-l-2 border-gray-200 space-y-2">
              @for (op of lv.operands; track $index) {
                <div class="flex items-start gap-2">
                  <div class="flex-1">
                    <expression-builder
                      [value]="op"
                      [fields]="fields()"
                      (valueChange)="replaceOperand($index, $event)"
                    />
                  </div>
                  <button
                    class="text-gray-400 hover:text-red-600"
                    (click)="removeOperand($index)"
                  >
                    <i class="bi bi-x-circle"></i>
                  </button>
                </div>
              }
            </div>
          } @else if (v.kind === 'comparison') {
            @let cv = $any(v);
            <div class="grid grid-cols-3 gap-2">
              <input
                class="wfe-input py-1 text-xs"
                list="expr-fields"
                placeholder="field"
                [ngModel]="cv.field"
                (ngModelChange)="setField($event)"
              />
              <datalist id="expr-fields">
                @for (f of fields(); track f) {
                  <option [value]="f"></option>
                }
              </datalist>
              <select
                class="wfe-input py-1 text-xs"
                [ngModel]="cv.operator"
                (ngModelChange)="setOperator($event)"
              >
                @for (op of ops; track op) {
                  <option [value]="op">{{ op }}</option>
                }
              </select>
              <input
                class="wfe-input py-1 text-xs"
                placeholder="value"
                [ngModel]="cv.value"
                (ngModelChange)="setValue($event)"
              />
            </div>
          }
        </ng-container>
      }
    </div>
  `,
})
export class ExpressionBuilderComponent {
  value = model<ExpressionNode>(emptyLogical('AND'));
  fields = input<string[]>([]);

  ops: ComparisonOperator[] = [
    'EQ',
    'NEQ',
    'GT',
    'GTE',
    'LT',
    'LTE',
    'IN',
    'NOT_IN',
    'HAS_VALUE',
    'NOT_HAS_VALUE',
    'MATCHES',
  ];

  private emit(next: ExpressionNode) {
    this.value.set(next);
  }

  setLogicalOp(op: 'AND' | 'OR' | 'NOT') {
    const cur = this.value() as LogicalExpr;
    this.emit({ ...cur, operator: op });
  }
  addComparison() {
    const cur = this.value() as LogicalExpr;
    this.emit({ ...cur, operands: [...cur.operands, cmp('field', 'EQ', '')] });
  }
  addGroup() {
    const cur = this.value() as LogicalExpr;
    this.emit({ ...cur, operands: [...cur.operands, emptyLogical('AND')] });
  }
  replaceOperand(i: number, next: ExpressionNode) {
    const cur = this.value() as LogicalExpr;
    this.emit({ ...cur, operands: cur.operands.map((o, j) => (j === i ? next : o)) });
  }
  removeOperand(i: number) {
    const cur = this.value() as LogicalExpr;
    this.emit({ ...cur, operands: cur.operands.filter((_, j) => j !== i) });
  }
  setField(f: string) {
    const cur = this.value() as ComparisonExpr;
    this.emit({ ...cur, field: f });
  }
  setOperator(op: ComparisonOperator) {
    const cur = this.value() as ComparisonExpr;
    this.emit({ ...cur, operator: op });
  }
  setValue(v: string) {
    const cur = this.value() as ComparisonExpr;
    this.emit({ ...cur, value: v });
  }
}
