import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import {
  ActionDefinitionDto,
  CreateActionDefinitionRequest,
  UpdateActionDefinitionRequest,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class ActionDefinitionsApiService extends ApiBase {
  create(body: CreateActionDefinitionRequest): Observable<ActionDefinitionDto> {
    return this.post<ActionDefinitionDto>('/action-definitions', body);
  }

  findAll(): Observable<ActionDefinitionDto[]> {
    return this.get<ActionDefinitionDto[]>('/action-definitions');
  }

  findActive(): Observable<ActionDefinitionDto[]> {
    return this.get<ActionDefinitionDto[]>('/action-definitions/active');
  }

  findByCode(code: string): Observable<ActionDefinitionDto> {
    return this.get<ActionDefinitionDto>(`/action-definitions/code/${code}`);
  }

  findOne(id: string): Observable<ActionDefinitionDto> {
    return this.get<ActionDefinitionDto>(`/action-definitions/${id}`);
  }

  update(id: string, body: UpdateActionDefinitionRequest): Observable<ActionDefinitionDto> {
    return this.patch<ActionDefinitionDto>(`/action-definitions/${id}`, body);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/action-definitions/${id}`);
  }
}
