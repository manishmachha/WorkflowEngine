import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import {
  CreateWorkflowActionRequest,
  UpdateWorkflowActionRequest,
  WorkflowActionDto,
  WorkflowActionEvent,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class WorkflowActionsApiService extends ApiBase {
  create(body: CreateWorkflowActionRequest): Observable<WorkflowActionDto> {
    return this.post<WorkflowActionDto>('/workflow-actions', body);
  }

  findAll(): Observable<WorkflowActionDto[]> {
    return this.get<WorkflowActionDto[]>('/workflow-actions');
  }

  findAllByNode(workflowNodeId: string): Observable<WorkflowActionDto[]> {
    return this.get<WorkflowActionDto[]>(`/workflow-actions/node/${workflowNodeId}`);
  }

  findByNodeAndEvent(workflowNodeId: string, event: WorkflowActionEvent): Observable<WorkflowActionDto[]> {
    return this.get<WorkflowActionDto[]>(`/workflow-actions/node/${workflowNodeId}/event/${event}`);
  }

  findAllByTransition(workflowTransitionId: string): Observable<WorkflowActionDto[]> {
    return this.get<WorkflowActionDto[]>(`/workflow-actions/transition/${workflowTransitionId}`);
  }

  findOne(id: string): Observable<WorkflowActionDto> {
    return this.get<WorkflowActionDto>(`/workflow-actions/${id}`);
  }

  update(id: string, body: UpdateWorkflowActionRequest): Observable<WorkflowActionDto> {
    return this.patch<WorkflowActionDto>(`/workflow-actions/${id}`, body);
  }

  deleteAction(id: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/workflow-actions/${id}`);
  }
}
