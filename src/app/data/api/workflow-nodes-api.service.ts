import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import {
  CreateWorkflowNodeRequest,
  UpdateWorkflowNodeRequest,
  WorkflowNodeDto,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class WorkflowNodesApiService extends ApiBase {
  create(workflowDefinitionId: string, workflowVersionId: string, body: CreateWorkflowNodeRequest): Observable<WorkflowNodeDto> {
    return this.post<WorkflowNodeDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/nodes`, body);
  }

  findByWorkflowVersion(workflowDefinitionId: string, workflowVersionId: string): Observable<WorkflowNodeDto[]> {
    return this.get<WorkflowNodeDto[]>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/nodes`);
  }

  findOne(workflowDefinitionId: string, workflowVersionId: string, id: string): Observable<WorkflowNodeDto> {
    return this.get<WorkflowNodeDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/nodes/${id}`);
  }

  update(workflowDefinitionId: string, workflowVersionId: string, id: string, body: UpdateWorkflowNodeRequest): Observable<WorkflowNodeDto> {
    return this.patch<WorkflowNodeDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/nodes/${id}`, body);
  }

  remove(workflowDefinitionId: string, workflowVersionId: string, id: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/workflow-definitions/${workflowDefinitionId}/versions/${workflowVersionId}/nodes/${id}`);
  }
}
