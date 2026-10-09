import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class TasksApi {
  list(filter: { assignee?: string; status?: 'open' | 'completed' } = {}): Observable<UserTask[]> {
    return of([]);
  }
  get(id: string): Observable<UserTask | undefined> {
    return of(undefined);
  }
  complete(id: string, actionKey: string, payload: Record<string, unknown>, userId: string) {
    return of({ ok: true });
  }
  reassign(taskId: string, newUserId: string, byUserId: string) {
    return of({ ok: true });
  }
}

export interface Attachment { [key: string]: any; }
export interface AuditEvent { [key: string]: any; }
export interface FormDefinition { [key: string]: any; }
export interface Notification { [key: string]: any; }
export interface BusinessRule { [key: string]: any; }
export interface FormSubmission { [key: string]: any; }
export interface UserTask { [key: string]: any; }
