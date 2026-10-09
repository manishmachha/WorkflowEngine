import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import { PermissionDto } from './api-models';

@Injectable({ providedIn: 'root' })
export class PermissionsApiService extends ApiBase {
  findAll(): Observable<PermissionDto[]> {
    return this.get<PermissionDto[]>('/permissions');
  }
}
