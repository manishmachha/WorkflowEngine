import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import {
  CreateWorkflowVersionRequest,
  UpdateWorkflowVersionRequest,
  WorkflowVersionDto,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class WorkflowVersionsApiService extends ApiBase {
  create(workflowDefinitionId: string, body: CreateWorkflowVersionRequest): Observable<WorkflowVersionDto> {
    return this.post<WorkflowVersionDto>(`/workflow-definitions/${workflowDefinitionId}/versions`, body);
  }

  findAll(workflowDefinitionId: string): Observable<WorkflowVersionDto[]> {
    return this.get<WorkflowVersionDto[]>(`/workflow-definitions/${workflowDefinitionId}/versions`);
  }

  findOne(workflowDefinitionId: string, id: string): Observable<WorkflowVersionDto> {
    return this.get<WorkflowVersionDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${id}`);
  }

  update(workflowDefinitionId: string, id: string, body: UpdateWorkflowVersionRequest): Observable<WorkflowVersionDto> {
    return this.patch<WorkflowVersionDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${id}`, body);
  }

  publish(workflowDefinitionId: string, id: string): Observable<WorkflowVersionDto> {
    return this.post<WorkflowVersionDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${id}/publish`);
  }

  archive(workflowDefinitionId: string, id: string): Observable<WorkflowVersionDto> {
    return this.post<WorkflowVersionDto>(`/workflow-definitions/${workflowDefinitionId}/versions/${id}/archive`);
  }
}
