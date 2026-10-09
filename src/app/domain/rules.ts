export type ComparisonOperator =
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'IN'
  | 'NOT_IN'
  | 'HAS_VALUE'
  | 'NOT_HAS_VALUE'
  | 'MATCHES';

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export type ExpressionNode = ComparisonExpr | LogicalExpr | LiteralExpr;

export interface ComparisonExpr {
  kind: 'comparison';
  field: string;
  operator: ComparisonOperator;
  value?: unknown;
}

export interface LogicalExpr {
  kind: 'logical';
  operator: LogicalOperator;
  operands: ExpressionNode[];
}

export interface LiteralExpr {
  kind: 'literal';
  value: boolean;
}

export type EvalScope = Record<string, unknown>;

export function evaluate(expr: ExpressionNode | undefined, scope: EvalScope): boolean {
  if (!expr) return true;
  switch (expr.kind) {
    case 'literal':
      return !!expr.value;
    case 'logical':
      if (expr.operator === 'AND') return expr.operands.every((o) => evaluate(o, scope));
      if (expr.operator === 'OR') return expr.operands.some((o) => evaluate(o, scope));
      return !evaluate(expr.operands[0], scope);
    case 'comparison': {
      const v = getPath(scope, expr.field);
      const c = expr.value;
      switch (expr.operator) {
        case 'EQ':
          return Array.isArray(v) ? v.includes(c) : v === c;
        case 'NEQ':
          return Array.isArray(v) ? !v.includes(c) : v !== c;
        case 'GT':
          return Number(v) > Number(c);
        case 'GTE':
          return Number(v) >= Number(c);
        case 'LT':
          return Number(v) < Number(c);
        case 'LTE':
          return Number(v) <= Number(c);
        case 'IN':
          return Array.isArray(c) ? c.includes(v as never) : false;
        case 'NOT_IN':
          return Array.isArray(c) ? !c.includes(v as never) : true;
        case 'HAS_VALUE':
          return v !== null && v !== undefined && v !== '';
        case 'NOT_HAS_VALUE':
          return v === null || v === undefined || v === '';
        case 'MATCHES':
          try {
            return new RegExp(String(c)).test(String(v ?? ''));
          } catch {
            return false;
          }
      }
    }
  }
}

function getPath(obj: unknown, path: string): unknown {
  if (obj == null || !path) return obj;
  return path
    .split('.')
    .reduce<unknown>((acc, k) => (acc == null ? undefined : (acc as Record<string, unknown>)[k]), obj);
}

export const emptyLogical = (op: LogicalOperator = 'AND'): LogicalExpr => ({
  kind: 'logical',
  operator: op,
  operands: [],
});

export const cmp = (
  field: string,
  operator: ComparisonOperator,
  value?: unknown,
): ComparisonExpr => ({ kind: 'comparison', field, operator, value });
