import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { WorkflowEvent } from '../../domain/events';

export type AppEvent =
  | WorkflowEvent
  | { type: 'version_conflict'; url: string }
  | { type: 'network_status'; online: boolean };

@Injectable({ providedIn: 'root' })
export class EventBusService {
  private subject = new Subject<AppEvent>();
  readonly events$ = this.subject.asObservable();

  emit(evt: AppEvent) {
    this.subject.next(evt);
  }
}
