import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
  UserRoleDto,
  AssignRoleRequest,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class UsersApiService extends ApiBase {
  create(body: CreateUserRequest): Observable<UserDto> {
    return this.post<UserDto>('/users', body);
  }

  getMe(): Observable<UserDto> {
    return this.get<UserDto>('/users/me');
  }

  getById(id: string): Observable<UserDto> {
    return this.get<UserDto>(`/users/${id}`);
  }

  getByOrganizationId(organizationId: string): Observable<UserDto[]> {
    return this.get<UserDto[]>(`/users/organization/${organizationId}`);
  }

  update(id: string, body: UpdateUserRequest): Observable<UserDto> {
    return this.put<UserDto>(`/users/${id}`, body);
  }

  // User Roles
  assignRole(userId: string, body: AssignRoleRequest): Observable<UserRoleDto> {
    return this.post<UserRoleDto>(`/users/${userId}/roles`, body);
  }

  removeRole(userId: string, roleId: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/users/${userId}/roles/${roleId}`);
  }

  getUserRoles(userId: string): Observable<UserRoleDto[]> {
    return this.get<UserRoleDto[]>(`/users/${userId}/roles`);
  }
}
