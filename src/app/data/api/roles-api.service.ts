import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import { CreateRoleRequest, RoleDto, UpdateRoleRequest } from './api-models';

@Injectable({ providedIn: 'root' })
export class RolesApiService extends ApiBase {
  create(body: CreateRoleRequest): Observable<RoleDto> {
    return this.post<RoleDto>('/roles', body);
  }

  findAll(): Observable<RoleDto[]> {
    return this.get<RoleDto[]>('/roles');
  }

  findOne(id: string): Observable<RoleDto> {
    return this.get<RoleDto>(`/roles/${id}`);
  }

  update(id: string, body: UpdateRoleRequest): Observable<RoleDto> {
    return this.patch<RoleDto>(`/roles/${id}`, body);
  }
}
