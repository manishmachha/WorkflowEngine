import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Transition } from '../domain/definition';
import { ActionDefinitionsApiService } from './api/action-definitions-api.service';

export interface AvailableAction {
  transition: Transition;
  fromNodeId: string;
  nodeLabel: string;
}

@Injectable({ providedIn: 'root' })
export class ActionsApi {
  private actionsDefApi = inject(ActionDefinitionsApiService);

  available(instanceId: string, userRoles: string[]): Observable<AvailableAction[]> {
    return of([]); // Runtime engine not fully backend integrated yet
  }

  perform(
    instanceId: string,
    actionKey: string,
    payload: Record<string, unknown> | undefined,
    remarks: string | undefined,
    actorUserId: string,
    userRoles: string[],
  ): Observable<AvailableAction[]> {
    return throwError(() => new Error('Perform action not implemented on backend yet'));
  }

  /** Flatten every action-keyed transition across published definitions. */
  catalog(): { workflow: string; actionKey: string; from: string; to: string; roles: string[]; auto: boolean }[] {
    return [];
  }
}
