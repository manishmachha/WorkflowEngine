import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class NotificationService {
  list(userId: string): Observable<Notification[]> {
    return of([]);
  }
  markRead(id: string) {}
  notify(n: Partial<Notification>) {}
}

export interface Attachment { [key: string]: any; }
export interface AuditEvent { [key: string]: any; }
export interface FormDefinition { [key: string]: any; }
export interface Notification { [key: string]: any; }
export interface BusinessRule { [key: string]: any; }
export interface FormSubmission { [key: string]: any; }
export interface UserTask { [key: string]: any; }
