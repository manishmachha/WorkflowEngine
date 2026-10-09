import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AttachmentsApi {
  list(instanceId: string): Observable<Attachment[]> {
    return of([]);
  }
  upload(instanceId: string, file: File, uploaderId: string): Observable<Attachment> {
    return of({ id: 'dummy', fileName: file.name, fileSize: file.size, mimeType: file.type, uploadedAt: '', uploadedBy: uploaderId, url: '' });
  }
}

export interface Attachment { [key: string]: any; }
export interface AuditEvent { [key: string]: any; }
export interface FormDefinition { [key: string]: any; }
export interface Notification { [key: string]: any; }
export interface BusinessRule { [key: string]: any; }
export interface FormSubmission { [key: string]: any; }
export interface UserTask { [key: string]: any; }
