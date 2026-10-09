import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { OrganizationsApiService } from '../../data/api/organizations-api.service';
import { Department } from '../../domain/actors';

@Injectable({ providedIn: 'root' })
export class TenantStore {
  private auth = inject(AuthStore);
  private orgsApi = inject(OrganizationsApiService);

  private _departments = signal<Department[]>([]);
  readonly departments = this._departments.asReadonly();

  readonly active = computed(
    () => this.departments().find((d) => d.id === this.auth.activeTenantId()) ?? null,
  );

  constructor() {
    this.orgsApi.findAll().subscribe(orgs => {
      this._departments.set(orgs.map(o => ({
        id: o.id,
        code: o.code,
        name: o.name
      })));
    });
  }

  setActive(id: string) {
    this.auth.switchTenant(id);
  }
}
