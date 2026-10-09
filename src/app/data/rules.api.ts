import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class RulesApi {
  list(): Observable<BusinessRule[]> {
    return of([]);
  }
  get(id: string): Observable<BusinessRule | undefined> {
    return of(undefined);
  }
  save(rule: BusinessRule): Observable<BusinessRule> {
    return of(rule);
  }
}

export interface Attachment { [key: string]: any; }
export interface AuditEvent { [key: string]: any; }
export interface FormDefinition { [key: string]: any; }
export interface Notification { [key: string]: any; }
export interface BusinessRule { [key: string]: any; }
export interface FormSubmission { [key: string]: any; }
export interface UserTask { [key: string]: any; }
