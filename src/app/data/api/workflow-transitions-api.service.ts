import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import {
  CreateWorkflowTransitionRequest,
  UpdateWorkflowTransitionRequest,
  WorkflowTransitionDto,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class WorkflowTransitionsApiService extends ApiBase {
  create(workflowDefinitionId: string, workflowVersionId: string, body: CreateWorkflowTransitionRequest): Observable<WorkflowTransitionDto> {
    return this.post<WorkflowTransitionDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/transitions`, body);
  }

  findAll(workflowDefinitionId: string, workflowVersionId: string): Observable<WorkflowTransitionDto[]> {
    return this.get<WorkflowTransitionDto[]>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/transitions`);
  }

  findByFromNode(workflowDefinitionId: string, workflowVersionId: string, fromNodeId: string): Observable<WorkflowTransitionDto[]> {
    return this.get<WorkflowTransitionDto[]>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/transitions/from-node/${fromNodeId}`);
  }

  findById(workflowDefinitionId: string, workflowVersionId: string, id: string): Observable<WorkflowTransitionDto> {
    return this.get<WorkflowTransitionDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/transitions/${id}`);
  }

  update(workflowDefinitionId: string, workflowVersionId: string, id: string, body: UpdateWorkflowTransitionRequest): Observable<WorkflowTransitionDto> {
    return this.patch<WorkflowTransitionDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/transitions/${id}`, body);
  }

  deleteTransition(workflowDefinitionId: string, workflowVersionId: string, id: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/transitions/${id}`);
  }
}
