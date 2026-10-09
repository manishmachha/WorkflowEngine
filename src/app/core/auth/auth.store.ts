import { Injectable, computed, signal } from '@angular/core';
import { User } from '../../domain/actors';

export interface AuthSession {
  token: string;
  user: User;
  activeTenantId: string;
}

const STORAGE_KEY = 'wfe_session_v1';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _session = signal<AuthSession | null>(this.restore());

  readonly session = this._session.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this._session());
  readonly roles = computed(() => this._session()?.user.roles ?? []);
  readonly activeTenantId = computed(() => this._session()?.activeTenantId ?? null);

  login(session: AuthSession) {
    this._session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  logout() {
    this._session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  switchTenant(tenantId: string) {
    const s = this._session();
    if (!s) return;
    const next = { ...s, activeTenantId: tenantId };
    this._session.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  private restore(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }
}
