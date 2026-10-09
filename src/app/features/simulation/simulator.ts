import { WorkflowDefinition } from '../../domain/definition';
import { evaluate } from '../../domain/rules';
import { LibraryRule } from '../../domain/rule-library';

export interface SimulationStep {
  nodeId: string;
  nodeLabel: string;
  kind: string;
  branch?: string;
  reason?: string;
  ruleId?: string;
}

export interface SimulationResult {
  steps: SimulationStep[];
  ended: boolean;
  reason?: string;
}

export function simulate(
  def: WorkflowDefinition,
  scope: Record<string, unknown>,
  rules: LibraryRule[] = [],
  maxSteps = 50,
): SimulationResult {
  const start = def.nodes.find((n) => n.kind === 'start');
  if (!start) return { steps: [], ended: false, reason: 'No start node' };

  const rulesById = new Map(rules.map((r) => [r.id, r]));
  const nodes = new Map(def.nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, typeof def.transitions>();
  for (const t of def.transitions) {
    outgoing.set(t.from, [...(outgoing.get(t.from) ?? []), t]);
  }
  for (const [k, list] of outgoing) {
    outgoing.set(k, list.slice().sort((a, b) => a.priority - b.priority));
  }

  const evalTransition = (t: (typeof def.transitions)[number]) => {
    if (t.ruleId) {
      const r = rulesById.get(t.ruleId);
      if (!r) return false;
      return evaluate(r.expression, scope);
    }
    if (t.condition) return evaluate(t.condition, scope);
    return false;
  };

  const steps: SimulationStep[] = [];
  let cur = start.id;
  for (let i = 0; i < maxSteps; i++) {
    const node = nodes.get(cur)!;
    steps.push({ nodeId: node.id, nodeLabel: node.label, kind: node.kind });
    if (node.kind === 'end') return { steps, ended: true };

    const out = outgoing.get(cur) ?? [];
    if (!out.length) return { steps, ended: false, reason: 'Dead-end node' };

    let chosen = out.find(evalTransition);
    if (!chosen) chosen = out.find((t) => t.isDefault);
    if (!chosen) chosen = out[0];

    steps[steps.length - 1].branch =
      chosen.actionLabel || chosen.actionKey || (chosen.isDefault ? 'default' : chosen.id);
    steps[steps.length - 1].ruleId = chosen.ruleId;
    cur = chosen.to;
  }
  return { steps, ended: false, reason: `Aborted after ${maxSteps} steps` };
}
