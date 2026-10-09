export type InstanceStatus =
  | 'running'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'needs_attention';

export type TaskStatus =
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'escalated'
  | 'reassigned';

export type TaskAction =
  | 'approve'
  | 'reject'
  | 'request_clarification'
  | 'forward'
  | 'complete'
  | 'submit';

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  definitionVersion: number;
  code: string;
  entityRef: { type: string; id: string };
  status: InstanceStatus;
  currentNodeIds: string[];
  initiatorUserId: string;
  tenantId: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  dueAt?: string;
  startedAt: string;
  completedAt?: string;
  version: number; // optimistic lock
  variables: Record<string, unknown>;
}

export interface TaskInstance {
  id: string;
  instanceId: string;
  nodeId: string;
  nodeLabel: string;
  assigneeUserId?: string;
  assigneeRole?: string;
  status: TaskStatus;
  dueAt?: string;
  createdAt: string;
  firstResponseAt?: string;
  completedAt?: string;
  actionTaken?: TaskAction;
  remarks?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  slaBreached?: boolean;
  escalationCount: number;
  version: number;
  idempotencyKey: string;
  formSubmission?: Record<string, unknown>;
}

export interface TransitionLog {
  id: string;
  instanceId: string;
  fromNodeId?: string;
  toNodeId: string;
  actorUserId?: string;
  timestamp: string;
  action?: TaskAction;
  reason?: string;
  ruleId?: string;
  outputSnapshot?: Record<string, unknown>;
}

export interface CaseDataSnapshot {
  id: string;
  instanceId: string;
  nodeId: string;
  nodeLabel: string;
  taskId?: string;
  formId?: string;
  formVersion?: number;
  data: Record<string, unknown>;
  variables: Record<string, unknown>;
  actor?: string;
  reason?: string;
  capturedAt: string;
}

export interface TaskAttachment {
  id: string;
  instanceId: string;
  taskId?: string;
  nodeId?: string;
  name: string;
  contentType: string;
  sizeBytes: number;
  dataUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  caption?: string;
}
