import { ExpressionNode } from './rules';

export type RuleCategory =
  | 'routing'
  | 'validation'
  | 'assignment'
  | 'escalation'
  | 'sla'
  | 'authorization'
  | 'custom';

export interface LibraryRule {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: RuleCategory;
  version: number;
  status: 'draft' | 'published' | 'retired';
  expression: ExpressionNode;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface RuleUsage {
  ruleId: string;
  definitionId: string;
  definitionName: string;
  version: number;
  location: 'transition' | 'node-guard' | 'validation';
  ref: string; // transition id or node id
}
