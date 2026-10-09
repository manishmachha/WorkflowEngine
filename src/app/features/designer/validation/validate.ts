import { WorkflowDefinition } from '../../../domain/definition';

export type IssueSeverity = 'error' | 'warn' | 'info';

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  nodeId?: string;
  transitionId?: string;
}

export function validateDefinition(def: WorkflowDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodesById = new Map(def.nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, typeof def.transitions>();
  const incoming = new Map<string, typeof def.transitions>();
  for (const t of def.transitions) {
    outgoing.set(t.from, [...(outgoing.get(t.from) ?? []), t]);
    incoming.set(t.to, [...(incoming.get(t.to) ?? []), t]);
  }

  const starts = def.nodes.filter((n) => n.kind === 'start');
  const ends = def.nodes.filter((n) => n.kind === 'end');
  if (starts.length !== 1) {
    issues.push({
      severity: 'error',
      code: 'START_COUNT',
      message: `Definition must have exactly one Start node (found ${starts.length}).`,
    });
  }
  if (ends.length === 0) {
    issues.push({
      severity: 'error',
      code: 'NO_END',
      message: 'Definition must have at least one End node.',
    });
  }

  // Reachability from start
  if (starts.length === 1) {
    const reachable = new Set<string>();
    const stack = [starts[0].id];
    while (stack.length) {
      const cur = stack.pop()!;
      if (reachable.has(cur)) continue;
      reachable.add(cur);
      for (const t of outgoing.get(cur) ?? []) stack.push(t.to);
    }
    for (const n of def.nodes) {
      if (!reachable.has(n.id)) {
        issues.push({
          severity: 'error',
          code: 'ORPHAN',
          message: `Node "${n.label}" is unreachable from Start.`,
          nodeId: n.id,
        });
      }
    }
    // End coverage: every reachable node without outgoing must be an End
    for (const nid of reachable) {
      const n = nodesById.get(nid)!;
      if (n.kind === 'end') continue;
      if (!(outgoing.get(nid)?.length ?? 0)) {
        issues.push({
          severity: 'error',
          code: 'DEAD_END',
          message: `Node "${n.label}" has no outgoing transition and is not an End node.`,
          nodeId: n.id,
        });
      }
    }
  }

  // Condition nodes must be total: at least one default
  for (const n of def.nodes) {
    if (n.kind === 'condition') {
      const out = outgoing.get(n.id) ?? [];
      if (out.length < 2) {
        issues.push({
          severity: 'warn',
          code: 'CONDITION_BRANCHES',
          message: `Condition "${n.label}" should have at least 2 outgoing routes.`,
          nodeId: n.id,
        });
      }
      if (!out.some((t) => t.isDefault)) {
        issues.push({
          severity: 'error',
          code: 'CONDITION_NO_DEFAULT',
          message: `Condition "${n.label}" must have a default outgoing route.`,
          nodeId: n.id,
        });
      }
    }

    if (
      (n.kind === 'userTask' || n.kind === 'approval' || n.kind === 'review') &&
      !n.assignment?.strategy
    ) {
      issues.push({
        severity: 'error',
        code: 'NO_ASSIGNMENT',
        message: `${n.kind} "${n.label}" needs an actor resolution strategy.`,
        nodeId: n.id,
      });
    }

    if ((n.kind === 'systemTask' || n.kind === 'apiCall') && !n.failure) {
      issues.push({
        severity: 'error',
        code: 'NO_FAILURE_POLICY',
        message: `${n.kind} "${n.label}" must declare a failure policy (retries, timeout, terminal action).`,
        nodeId: n.id,
      });
    }

    if ((n.kind === 'userTask' || n.kind === 'approval') && n.formRef && !n.formRef.formVersion) {
      issues.push({
        severity: 'warn',
        code: 'FORM_VERSION_UNPINNED',
        message: `Form on "${n.label}" is not version-pinned; live cases may break.`,
        nodeId: n.id,
      });
    }
  }

  // Cycle detection (deadlock) via Tarjan-lite: any SCC with size > 1 among non-join nodes is a warn
  const idx = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stackArr: string[] = [];
  let counter = 0;
  const sccs: string[][] = [];
  const strongconnect = (v: string) => {
    idx.set(v, counter);
    low.set(v, counter);
    counter++;
    stackArr.push(v);
    onStack.add(v);
    for (const t of outgoing.get(v) ?? []) {
      if (!idx.has(t.to)) {
        strongconnect(t.to);
        low.set(v, Math.min(low.get(v)!, low.get(t.to)!));
      } else if (onStack.has(t.to)) {
        low.set(v, Math.min(low.get(v)!, idx.get(t.to)!));
      }
    }
    if (low.get(v) === idx.get(v)) {
      const scc: string[] = [];
      let w;
      do {
        w = stackArr.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) sccs.push(scc);
    }
  };
  for (const n of def.nodes) if (!idx.has(n.id)) strongconnect(n.id);
  for (const scc of sccs) {
    issues.push({
      severity: 'warn',
      code: 'CYCLE',
      message: `Cycle detected involving nodes: ${scc
        .map((id) => nodesById.get(id)?.label ?? id)
        .join(' → ')}. Review for unintended deadlock.`,
    });
  }

  // Dangling transitions
  for (const t of def.transitions) {
    if (!nodesById.has(t.from) || !nodesById.has(t.to)) {
      issues.push({
        severity: 'error',
        code: 'DANGLING_TRANSITION',
        message: `Transition references missing node.`,
        transitionId: t.id,
      });
    }
  }

  return issues;
}
