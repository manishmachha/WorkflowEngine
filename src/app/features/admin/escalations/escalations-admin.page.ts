import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActorsApi } from '../../../data/actors.api';
import { EscalationPolicy } from '../../../domain/actors';
import { AdminShellComponent } from '../admin-shell.component';

@Component({
  selector: 'escalations-admin',
  standalone: true,
  imports: [FormsModule, AdminShellComponent],
  template: `
    <admin-shell />
    <div class="wfe-page">
      <h1 class="wfe-page-title">Escalation Policies</h1>
      @for (p of policies(); track p.id) {
        <div class="wfe-card p-4 mb-3">
          <div class="flex items-center gap-2 mb-2">
            <input
              class="wfe-input max-w-xs font-semibold"
              [ngModel]="p.name"
              (ngModelChange)="setName(p, $event)"
            />
          </div>
          <table class="w-full text-sm">
            <thead class="text-xs text-gray-500 uppercase">
              <tr>
                <th class="text-left">After (min)</th>
                <th class="text-left">Target</th>
                <th class="text-left">Role/User</th>
                <th class="text-left">Notify</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (l of p.levels; track $index) {
                <tr class="border-t">
                  <td class="py-1">
                    <input
                      type="number"
                      class="wfe-input py-1"
                      [ngModel]="l.afterMinutes"
                      (ngModelChange)="updateLevel(p, $index, { afterMinutes: +$event })"
                    />
                  </td>
                  <td>
                    <select
                      class="wfe-input py-1"
                      [ngModel]="l.target"
                      (ngModelChange)="updateLevel(p, $index, { target: $event })"
                    >
                      <option value="reportingManager">Reporting manager</option>
                      <option value="departmentHead">Department head</option>
                      <option value="fixedRole">Fixed role</option>
                      <option value="fixedUser">Fixed user</option>
                    </select>
                  </td>
                  <td>
                    <input
                      class="wfe-input py-1"
                      [ngModel]="l.role || l.userId"
                      (ngModelChange)="updateLevel(p, $index, { role: $event })"
                    />
                  </td>
                  <td class="text-xs">{{ l.notify?.join(', ') || '—' }}</td>
                  <td class="text-right">
                    <button class="text-red-600 text-xs" (click)="removeLevel(p, $index)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <button class="wfe-btn-ghost text-xs mt-2" (click)="addLevel(p)">
            <i class="bi bi-plus-lg"></i> Add level
          </button>
        </div>
      }
      <button class="wfe-btn-primary text-xs" (click)="addPolicy()">
        <i class="bi bi-plus-lg"></i> New policy
      </button>
    </div>
  `,
})
export class EscalationsAdminPage {
  private api = inject(ActorsApi);
  policies = signal<EscalationPolicy[]>([]);
  constructor() {
    this.reload();
  }
  reload() {
    this.api.escalations().subscribe((p) => this.policies.set(p));
  }
  addPolicy() {
    this.api.upsertEscalation({ id: 'esc-' + Date.now(), name: 'New Policy', levels: [] });
    this.reload();
  }
  setName(p: EscalationPolicy, name: string) {
    this.api.upsertEscalation({ ...p, name });
    this.reload();
  }
  addLevel(p: EscalationPolicy) {
    this.api.upsertEscalation({
      ...p,
      levels: [...p.levels, { afterMinutes: 60, target: 'reportingManager', notify: ['inApp'] }],
    });
    this.reload();
  }
  updateLevel(p: EscalationPolicy, i: number, patch: object) {
    const next = p.levels.map((l, j) => (j === i ? { ...l, ...patch } : l));
    this.api.upsertEscalation({ ...p, levels: next });
    this.reload();
  }
  removeLevel(p: EscalationPolicy, i: number) {
    this.api.upsertEscalation({ ...p, levels: p.levels.filter((_, j) => j !== i) });
    this.reload();
  }
}
