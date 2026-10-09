import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Delegation,
  EscalationPolicy,
  HolidayCalendar,
  Role,
  User,
} from '../domain/actors';
import { UsersApiService } from './api/users-api.service';
import { RolesApiService } from './api/roles-api.service';

@Injectable({ providedIn: 'root' })
export class ActorsApi {
  private usersApi = inject(UsersApiService);
  private rolesApi = inject(RolesApiService);

  users(): Observable<User[]> {
    // Currently fetches from organization 1, ideally we should get this from the tenant store
    return this.usersApi.getByOrganizationId('1').pipe(
      map(dtos => dtos.map(u => ({
        id: u.id,
        displayName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        roles: [], // roles need to be fetched separately if needed
        active: u.isActive
      })))
    );
  }

  roles(): Observable<Role[]> {
    return this.rolesApi.findAll().pipe(
      map(dtos => dtos.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description || undefined
      })))
    );
  }

  delegations(): Observable<Delegation[]> {
    return of([]); // Not implemented in backend
  }

  escalations(): Observable<EscalationPolicy[]> {
    return of([]); // Not implemented in backend
  }

  calendars(): Observable<HolidayCalendar[]> {
    return of([]); // Not implemented in backend
  }

  upsertUser(u: User) {
    // Not implemented from UI yet, would call usersApi.create or update
  }

  upsertRole(r: Role) {
    this.rolesApi.create({
      code: r.code,
      name: r.name,
      description: r.description,
      permissionIds: []
    }).subscribe();
  }

  upsertDelegation(d: Delegation) {}
  deleteDelegation(id: string) {}
  upsertEscalation(e: EscalationPolicy) {}
  upsertCalendar(c: HolidayCalendar) {}
}
