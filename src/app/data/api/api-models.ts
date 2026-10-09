/**
 * Backend domain models matching the wfengine DTOs and entities.
 * These are distinct from the frontend domain models in /domain/.
 */

// ── Auth ──
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ── Organization ──
export interface OrganizationDto {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateOrganizationRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

// ── User ──
export interface UserDto {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

// ── Role ──
export interface RoleDto {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: PermissionDto[];
}

export interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

// ── Permission ──
export interface PermissionDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── User Role ──
export interface UserRoleDto {
  id: string;
  userId: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignRoleRequest {
  roleId: string;
}

// ── Workflow Definition ──
export interface WorkflowDefinitionDto {
  id: string;
  organizationId: string;
  workflowKey: string;
  name: string;
  description: string | null;
  active: boolean;
  createdById: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  versions?: WorkflowVersionDto[];
}

export interface CreateWorkflowDefinitionRequest {
  workflowKey: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateWorkflowDefinitionRequest {
  workflowKey?: string;
  name?: string;
  description?: string;
  active?: boolean;
}

// ── Workflow Version ──
export type WorkflowVersionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface WorkflowVersionDto {
  id: string;
  workflowDefinitionId: string;
  version: number;
  status: WorkflowVersionStatus;
  startingDate: string | null;
  expiryDate: string | null;
  createdById: string;
  publishedById: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowVersionRequest {
  startingDate?: string;
  expiryDate?: string;
}

export interface UpdateWorkflowVersionRequest {
  startingDate?: string;
  expiryDate?: string;
}

// ── Workflow Node ──
export type WorkflowNodeType =
  | 'START'
  | 'END'
  | 'USER_TASK'
  | 'SERVICE_TASK'
  | 'APPROVAL'
  | 'EXCLUSIVE_GATEWAY'
  | 'PARALLEL_GATEWAY';

export interface WorkflowNodeDto {
  id: string;
  workflowVersionId: string;
  nodeKey: string;
  name: string;
  description: string | null;
  type: WorkflowNodeType;
  formId: string | null;
  formVersionId: string | null;
  configuration: Record<string, unknown> | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowNodeRequest {
  nodeKey: string;
  name: string;
  description?: string;
  type: WorkflowNodeType;
  formId?: string;
  formVersionId?: string;
  configuration?: Record<string, unknown>;
  position?: number;
}

export interface UpdateWorkflowNodeRequest {
  nodeKey?: string;
  name?: string;
  description?: string;
  type?: WorkflowNodeType;
  formId?: string;
  formVersionId?: string;
  configuration?: Record<string, unknown>;
  position?: number;
}

// ── Workflow Transition ──
export interface WorkflowTransitionDto {
  id: string;
  workflowVersionId: string;
  fromNodeId: string;
  toNodeId: string;
  transitionKey: string;
  name: string;
  condition: Record<string, unknown> | null;
  priority: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowTransitionRequest {
  transitionKey: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  condition?: Record<string, unknown>;
  priority?: number;
  isDefault?: boolean;
}

export interface UpdateWorkflowTransitionRequest {
  transitionKey?: string;
  name?: string;
  fromNodeId?: string;
  toNodeId?: string;
  condition?: Record<string, unknown>;
  priority?: number;
  isDefault?: boolean;
}

// ── Workflow Action ──
export type WorkflowActionEvent = 'ON_ENTER' | 'ON_EXIT' | 'ON_COMPLETE';

export interface WorkflowActionDto {
  id: string;
  workflowNodeId: string | null;
  workflowTransitionId: string | null;
  actionDefinitionId: string;
  event: WorkflowActionEvent | null;
  configuration: Record<string, unknown> | null;
  sequence: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowActionRequest {
  workflowNodeId?: string;
  workflowTransitionId?: string;
  actionDefinitionId: string;
  event?: WorkflowActionEvent;
  configuration?: Record<string, unknown>;
  sequence?: number;
  active?: boolean;
}

export interface UpdateWorkflowActionRequest {
  workflowNodeId?: string;
  workflowTransitionId?: string;
  actionDefinitionId?: string;
  event?: WorkflowActionEvent;
  configuration?: Record<string, unknown>;
  sequence?: number;
  active?: boolean;
}

// ── Action Definition ──
export type ActionDefinitionType = 'SYSTEM' | 'CUSTOM';

export interface ActionDefinitionDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: ActionDefinitionType;
  handlerKey: string;
  configurationSchema: Record<string, unknown> | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionDefinitionRequest {
  code: string;
  name: string;
  description?: string;
  type: ActionDefinitionType;
  handlerKey: string;
  configurationSchema?: Record<string, unknown>;
  active?: boolean;
}

export interface UpdateActionDefinitionRequest {
  code?: string;
  name?: string;
  description?: string;
  type?: ActionDefinitionType;
  handlerKey?: string;
  configurationSchema?: Record<string, unknown>;
  active?: boolean;
}

// ── Workflow Instance ──
export type WorkflowInstanceStatus = 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'WAITING';

export interface WorkflowInstanceDto {
  id: string;
  workflowVersionId: string;
  organizationId: string;
  businessKey: string | null;
  status: WorkflowInstanceStatus;
  startedById: string;
  startedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  waitingReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowInstanceRequest {
  businessKey?: string;
}
