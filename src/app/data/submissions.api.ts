import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class SubmissionsApi {
  list(formId?: string): Observable<FormSubmission[]> {
    return of([]);
  }
  get(id: string): Observable<FormSubmission | undefined> {
    return of(undefined);
  }
  create(sub: FormSubmission): Observable<FormSubmission> {
    return of(sub);
  }
}

export interface Attachment { [key: string]: any; }
export interface AuditEvent { [key: string]: any; }
export interface FormDefinition { [key: string]: any; }
export interface Notification { [key: string]: any; }
export interface BusinessRule { [key: string]: any; }
export interface FormSubmission { [key: string]: any; }
export interface UserTask { [key: string]: any; }
