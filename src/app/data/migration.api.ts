import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MigrationApi {
  analyze(instanceIds: string[], targetVersion: number): Observable<any> {
    return of({ ok: true });
  }
  execute(instanceIds: string[], targetVersion: number): Observable<any> {
    return of({ ok: true });
  }
}
