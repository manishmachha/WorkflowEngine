import { WorkflowDefinition, WorkflowNode, Transition, NodeKind } from '../../domain/definition';
import {
  WorkflowDefinitionDto,
  WorkflowVersionDto,
  WorkflowNodeDto,
  WorkflowTransitionDto,
  WorkflowActionDto,
  WorkflowNodeType,
} from './api-models';

export class ApiMapper {
  static mapNodeKindToBackend(kind: NodeKind): WorkflowNodeType {
    switch (kind) {
      case 'start': return 'START';
      case 'end': return 'END';
      case 'userTask': return 'USER_TASK';
      case 'approval': return 'APPROVAL';
      case 'parallelSplit': return 'PARALLEL_GATEWAY';
      case 'condition': return 'EXCLUSIVE_GATEWAY';
      case 'apiCall':
      case 'systemTask':
      case 'notification':
        return 'SERVICE_TASK';
      default:
        return 'USER_TASK';
    }
  }

  static mapNodeKindToFrontend(type: WorkflowNodeType): NodeKind {
    switch (type) {
      case 'START': return 'start';
      case 'END': return 'end';
      case 'USER_TASK': return 'userTask';
      case 'APPROVAL': return 'approval';
      case 'PARALLEL_GATEWAY': return 'parallelSplit';
      case 'EXCLUSIVE_GATEWAY': return 'condition';
      case 'SERVICE_TASK': return 'systemTask';
      default: return 'userTask';
    }
  }

  static toFrontendDefinition(
    defDto: WorkflowDefinitionDto,
    versionDto: WorkflowVersionDto,
    nodesDto: WorkflowNodeDto[],
    transitionsDto: WorkflowTransitionDto[]
  ): WorkflowDefinition {
    const nodes: WorkflowNode[] = nodesDto.map(n => ({
      id: n.nodeKey,
      backendId: n.id,
      kind: this.mapNodeKindToFrontend(n.type),
      label: n.name,
      description: n.description || undefined,
      ui: (n.configuration?.['ui'] as any) || { x: 0, y: 0 },
      formRef: n.formId ? { formId: n.formId, formVersion: parseInt(n.formVersionId || '1') } : undefined,
      ...n.configuration, // Spread other configuration back
    }));

    const transitions: Transition[] = transitionsDto.map(t => {
      const fromNode = nodesDto.find(n => n.id === t.fromNodeId);
      const toNode = nodesDto.find(n => n.id === t.toNodeId);
      
      return {
        id: t.transitionKey,
        backendId: t.id,
        from: fromNode?.nodeKey || t.fromNodeId,
        to: toNode?.nodeKey || t.toNodeId,
        condition: t.condition as any,
        priority: t.priority,
        isDefault: t.isDefault,
        actionLabel: t.name,
        actionKey: t.transitionKey,
      };
    });

    return {
      id: defDto.id,
      code: defDto.workflowKey,
      name: defDto.name,
      description: defDto.description || undefined,
      version: versionDto.version,
      versionId: versionDto.id,
      status: versionDto.status === 'PUBLISHED' ? 'published' : versionDto.status === 'ARCHIVED' ? 'retired' : 'draft',
      tenantId: defDto.organizationId,
      entityType: 'case', // Default for now
      effectiveFrom: versionDto.startingDate || undefined,
      effectiveTo: versionDto.expiryDate || undefined,
      nodes,
      transitions,
      variables: [], // TODO: variables mapping if supported
      createdAt: versionDto.createdAt,
      updatedAt: versionDto.updatedAt,
    };
  }
}
