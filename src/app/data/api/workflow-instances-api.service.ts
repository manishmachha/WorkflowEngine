import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import {
  CreateWorkflowInstanceRequest,
  WorkflowInstanceDto,
  WorkflowInstanceStatus,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class WorkflowInstancesApiService extends ApiBase {
  create(workflowDefinitionId: string, body: CreateWorkflowInstanceRequest): Observable<WorkflowInstanceDto> {
    return this.post<WorkflowInstanceDto>(`/workflow-definitions/${workflowDefinitionId}/instances`, body);
  }

  findAll(workflowDefinitionId: string): Observable<WorkflowInstanceDto[]> {
    return this.get<WorkflowInstanceDto[]>(`/workflow-definitions/${workflowDefinitionId}/instances`);
  }

  findByStatus(workflowDefinitionId: string, status: WorkflowInstanceStatus): Observable<WorkflowInstanceDto[]> {
    return this.get<WorkflowInstanceDto[]>(`/workflow-definitions/${workflowDefinitionId}/instances/status/${status}`);
  }

  findOne(workflowDefinitionId: string, id: string): Observable<WorkflowInstanceDto> {
    return this.get<WorkflowInstanceDto>(`/workflow-definitions/${workflowDefinitionId}/instances/${id}`);
  }
}
