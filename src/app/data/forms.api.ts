import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class FormsApi {
  list(): Observable<FormDefinition[]> {
    return of([]);
  }
  get(id: string, version?: number): Observable<FormDefinition | undefined> {
    return of(undefined);
  }
  save(def: FormDefinition): Observable<FormDefinition> {
    return of(def);
  }
}

export interface Attachment { [key: string]: any; }
export interface AuditEvent { [key: string]: any; }
export interface FormDefinition { [key: string]: any; }
export interface Notification { [key: string]: any; }
export interface BusinessRule { [key: string]: any; }
export interface FormSubmission { [key: string]: any; }
export interface UserTask { [key: string]: any; }
