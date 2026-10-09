import { ExpressionNode } from './rules';

export type NodeKind =
  | 'start'
  | 'end'
  | 'userTask'
  | 'approval'
  | 'review'
  | 'systemTask'
  | 'apiCall'
  | 'notification'
  | 'condition'
  | 'parallelSplit'
  | 'join'
  | 'timer';

export type AssignmentStrategy =
  | 'ROLE'
  | 'REPORTING_MANAGER'
  | 'DEPARTMENT_HEAD'
  | 'ZONE_ENGINEER'
  | 'FIELD_BY_DISTRICT'
  | 'ASSET_OWNER'
  | 'ESCALATION_MANAGER'
  | 'ROUND_ROBIN'
  | 'LEAST_LOADED'
  | 'FIXED_USER';

export interface AssignmentRule {
  strategy: AssignmentStrategy;
  role?: string;
  userId?: string;
  fallback?: AssignmentRule;
  honorDelegation?: boolean;
}

export interface SlaPolicy {
  dueInMinutes: number;
  remindBeforeMinutes?: number;
  escalateAfterMinutes?: number;
  autoReassignAfterMinutes?: number;
  autoCloseAfterMinutes?: number;
  escalationPolicyId?: string;
}

export interface FailurePolicy {
  idempotencyKeyTemplate?: string;
  maxAttempts: number;
  backoff: 'linear' | 'exponential' | 'fixed';
  backoffSeconds: number;
  retryableErrors?: string[];
  timeoutSeconds: number;
  onTerminalFailure: 'needs_attention' | 'compensate' | 'fail_case';
  compensatingNodeId?: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  bodyTemplate?: Record<string, unknown>;
}

export interface FormRef {
  formId: string;
  formVersion: number;
  sectionId?: string;
  readOnly?: boolean;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  defaultValue?: unknown;
  description?: string;
}

export type JoinMode = 'all' | 'any' | 'quorum' | 'priority';

export interface JoinConfig {
  mode: JoinMode;
  quorum?: number;
  priorityBranchId?: string;
  cancelSiblings?: boolean;
}

export interface TimerConfig {
  relative?: string; // ISO 8601 duration e.g. "PT4H"
  absoluteVar?: string;
}

export type NodeActionKind =
  | 'submitForm'
  | 'callApi'
  | 'notify'
  | 'assign'
  | 'escalate'
  | 'setVariable'
  | 'emitEvent';

export interface NodeAction {
  id: string;
  kind: NodeActionKind;
  label: string;
  config?: Record<string, unknown>;
}

export interface WorkflowNode {
  id: string;
  backendId?: string;
  kind: NodeKind;
  label: string;
  description?: string;
  formRef?: FormRef;
  assignment?: AssignmentRule;
  sla?: SlaPolicy;
  failure?: FailurePolicy;
  join?: JoinConfig;
  timer?: TimerConfig;
  api?: ApiEndpoint;
  variables?: string[];
  actions?: NodeAction[];
  guardRuleId?: string;
  overrideRoles?: string[];
  ui: { x: number; y: number };
}

export interface Transition {
  id: string;
  backendId?: string;
  from: string;
  to: string;
  condition?: ExpressionNode;
  ruleId?: string;
  actionLabel?: string;
  actionKey?: string;
  allowedRoles?: string[];
  formRef?: FormRef;
  auto?: boolean;
  priority: number;
  isDefault: boolean;
}

export type DefinitionStatus = 'draft' | 'published' | 'retired';

export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  version: number;
  versionId?: string;
  status: DefinitionStatus;
  tenantId: string;
  entityType: string;
  nodes: WorkflowNode[];
  transitions: Transition[];
  variables: WorkflowVariable[];
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
  startFormId?: string;
  overrideRoles?: string[];
}

export const NODE_KINDS: { kind: NodeKind; label: string; icon: string; color: string }[] = [
  { kind: 'start', label: 'Start', icon: 'bi-play-circle-fill', color: '#22c55e' },
  { kind: 'end', label: 'End', icon: 'bi-stop-circle-fill', color: '#ef4444' },
  { kind: 'userTask', label: 'User Task', icon: 'bi-person-fill', color: '#3b82f6' },
  { kind: 'approval', label: 'Approval', icon: 'bi-check2-square', color: '#8b5cf6' },
  { kind: 'review', label: 'Review', icon: 'bi-eye-fill', color: '#06b6d4' },
  { kind: 'systemTask', label: 'System Task', icon: 'bi-cpu-fill', color: '#64748b' },
  { kind: 'apiCall', label: 'API Call', icon: 'bi-cloud-arrow-up-fill', color: '#0ea5e9' },
  { kind: 'notification', label: 'Notification', icon: 'bi-bell-fill', color: '#f59e0b' },
  { kind: 'condition', label: 'Condition', icon: 'bi-diamond-fill', color: '#eab308' },
  { kind: 'parallelSplit', label: 'Parallel Split', icon: 'bi-diagram-3-fill', color: '#14b8a6' },
  { kind: 'join', label: 'Join', icon: 'bi-diagram-2-fill', color: '#0d9488' },
  { kind: 'timer', label: 'Timer', icon: 'bi-clock-fill', color: '#a855f7' },
];
