import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { InstanceStatus, TransitionLog, WorkflowInstance } from '../domain/runtime';
import { WorkflowInstancesApiService } from './api/workflow-instances-api.service';
import { DefinitionsApi } from './definitions.api';
import { WorkflowInstanceStatus } from './api/api-models';

export interface InstanceFilter {
  status?: InstanceStatus | 'all';
  definitionId?: string;
  initiatorUserId?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class InstancesApi {
  private instancesApi = inject(WorkflowInstancesApiService);
  private definitionsApi = inject(DefinitionsApi);

  list(filter: InstanceFilter = {}): Observable<WorkflowInstance[]> {
    const defId = filter.definitionId;
    if (!defId) {
      return of([]);
    }

    if (filter.status && filter.status !== 'all') {
      let backendStatus: WorkflowInstanceStatus = 'RUNNING';
      switch (filter.status) {
        case 'running': backendStatus = 'RUNNING'; break;
        case 'completed': backendStatus = 'COMPLETED'; break;
        case 'cancelled': backendStatus = 'CANCELLED'; break;
        case 'failed': backendStatus = 'FAILED'; break;
        case 'needs_attention': backendStatus = 'WAITING'; break;
      }
      return this.instancesApi.findByStatus(defId, backendStatus).pipe(
        map(instances => this.mapInstances(instances, defId))
      );
    }

    return this.instancesApi.findAll(defId).pipe(
      map(instances => this.mapInstances(instances, defId))
    );
  }

  get(id: string): Observable<WorkflowInstance | undefined> {
    return this.instancesApi.findOne('unknown', id).pipe(
      map(res => ({
        id: res.id,
        definitionId: 'unknown',
        definitionVersion: 1,
        code: res.businessKey || `INST-${res.id.substring(0,6)}`,
        entityRef: { type: 'case', id: res.id },
        status: this.mapStatus(res.status),
        currentNodeIds: [],
        initiatorUserId: res.startedById,
        tenantId: res.organizationId,
        priority: 'normal',
        startedAt: res.startedAt,
        completedAt: res.completedAt || undefined,
        version: 1,
        variables: {}
      }))
    );
  }

  transitionLogs(instanceId: string): Observable<TransitionLog[]> {
    return of([]); // Not implemented in backend yet
  }

  needsAttention(): Observable<WorkflowInstance[]> {
    return of([]); // Global needs attention not implemented in backend
  }

  start(definitionId: string, actorId: string, initialVars: Record<string, unknown>): Observable<WorkflowInstance> {
    return this.instancesApi.create(definitionId, { businessKey: initialVars['businessKey'] as string }).pipe(
      map(res => ({
        id: res.id,
        definitionId: definitionId,
        definitionVersion: 1, // We need actual version
        code: res.businessKey || `INST-${res.id.substring(0,6)}`,
        entityRef: { type: 'case', id: res.id },
        status: this.mapStatus(res.status),
        currentNodeIds: [],
        initiatorUserId: res.startedById,
        tenantId: res.organizationId,
        priority: 'normal',
        startedAt: res.startedAt,
        completedAt: res.completedAt || undefined,
        version: 1,
        variables: {}
      }))
    );
  }

  recall(id: string, actorId: string) {
    return of({ ok: false }); // Not in backend
  }

  abort(id: string, reason: string, actorId: string) {
    return of({ ok: false }); // Not in backend
  }

  retryFailed(id: string, actorId: string) {
    return of(undefined); // Not in backend
  }

  private mapStatus(backendStatus: WorkflowInstanceStatus): InstanceStatus {
    switch (backendStatus) {
      case 'RUNNING': return 'running';
      case 'COMPLETED': return 'completed';
      case 'CANCELLED': return 'cancelled';
      case 'FAILED': return 'failed';
      case 'WAITING': return 'needs_attention';
      default: return 'running';
    }
  }

  private mapInstances(backendInstances: any[], definitionId: string): WorkflowInstance[] {
    return backendInstances.map(res => ({
        id: res.id,
        definitionId,
        definitionVersion: 1,
        code: res.businessKey || `INST-${res.id.substring(0,6)}`,
        entityRef: { type: 'case', id: res.id },
        status: this.mapStatus(res.status),
        currentNodeIds: [],
        initiatorUserId: res.startedById,
        tenantId: res.organizationId,
        priority: 'normal',
        startedAt: res.startedAt,
        completedAt: res.completedAt || undefined,
        version: 1,
        variables: {}
    }));
  }
}
