export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export type NotificationKind =
  | 'task_assigned'
  | 'task_reminder'
  | 'sla_breach'
  | 'escalation'
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_cancelled'
  | 'needs_attention'
  | 'custom';

export type NotificationStatus = 'queued' | 'delivered' | 'failed' | 'read';

export interface NotificationRecord {
  id: string;
  channel: NotificationChannel;
  kind: NotificationKind;
  toUserId?: string;
  toAddress?: string;
  subject: string;
  body: string;
  instanceId?: string;
  taskId?: string;
  createdAt: string;
  deliveredAt?: string;
  status: NotificationStatus;
  error?: string;
  meta?: Record<string, unknown>;
}
