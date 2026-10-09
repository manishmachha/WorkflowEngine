import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import {
  CreateOrganizationRequest,
  OrganizationDto,
  UpdateOrganizationRequest,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class OrganizationsApiService extends ApiBase {
  create(body: CreateOrganizationRequest): Observable<OrganizationDto> {
    return this.post<OrganizationDto>('/organizations', body);
  }

  findAll(): Observable<OrganizationDto[]> {
    return this.get<OrganizationDto[]>('/organizations');
  }

  findOne(id: string): Observable<OrganizationDto> {
    return this.get<OrganizationDto>(`/organizations/${id}`);
  }

  update(id: string, body: UpdateOrganizationRequest): Observable<OrganizationDto> {
    return this.patch<OrganizationDto>(`/organizations/${id}`, body);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/organizations/${id}`);
  }
}
