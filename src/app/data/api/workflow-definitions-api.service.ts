import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import {
  CreateWorkflowDefinitionRequest,
  UpdateWorkflowDefinitionRequest,
  WorkflowDefinitionDto,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class WorkflowDefinitionsApiService extends ApiBase {
  create(body: CreateWorkflowDefinitionRequest): Observable<WorkflowDefinitionDto> {
    return this.post<WorkflowDefinitionDto>('/workflow-definitions', body);
  }

  findAll(): Observable<WorkflowDefinitionDto[]> {
    return this.get<WorkflowDefinitionDto[]>('/workflow-definitions');
  }

  findByOrganization(): Observable<WorkflowDefinitionDto[]> {
    return this.get<WorkflowDefinitionDto[]>('/workflow-definitions/organization');
  }

  findOne(id: string): Observable<WorkflowDefinitionDto> {
    return this.get<WorkflowDefinitionDto>(`/workflow-definitions/${id}`);
  }

  update(id: string, body: UpdateWorkflowDefinitionRequest): Observable<WorkflowDefinitionDto> {
    return this.patch<WorkflowDefinitionDto>(`/workflow-definitions/${id}`, body);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/workflow-definitions/${id}`);
  }
}
