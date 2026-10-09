export type WorkflowEventType =
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.cancelled'
  | 'task.created'
  | 'task.assigned'
  | 'task.reassigned'
  | 'task.completed'
  | 'task.delegated'
  | 'transition.taken'
  | 'escalation.triggered'
  | 'sla.breached'
  | 'system_task.failed'
  | 'system_task.retried'
  | 'system_task.compensated';

export interface WorkflowEvent {
  id: string;
  type: WorkflowEventType;
  instanceId: string;
  timestamp: string;
  actorUserId?: string;
  payload: Record<string, unknown>;
}
