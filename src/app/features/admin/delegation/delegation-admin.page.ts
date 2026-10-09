import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActorsApi } from '../../../data/actors.api';
import { Delegation, User } from '../../../domain/actors';
import { AdminShellComponent } from '../admin-shell.component';

@Component({
  selector: 'delegation-admin',
  standalone: true,
  imports: [FormsModule, AdminShellComponent],
  template: `
    <admin-shell />
    <div class="wfe-page">
      <h1 class="wfe-page-title">Delegation Registry</h1>
      <div class="wfe-card p-4 mb-4">
        <h2 class="font-semibold mb-2">Create delegation</h2>
        <div class="grid grid-cols-5 gap-2 text-xs">
          <select class="wfe-input" [(ngModel)]="draft.fromUserId">
            <option value="">From user</option>
            @for (u of users(); track u.id) {
              <option [value]="u.id">{{ u.displayName }}</option>
            }
          </select>
          <select class="wfe-input" [(ngModel)]="draft.toUserId">
            <option value="">To user</option>
            @for (u of users(); track u.id) {
              <option [value]="u.id">{{ u.displayName }}</option>
            }
          </select>
          <input type="date" class="wfe-input" [(ngModel)]="draft.from" />
          <input type="date" class="wfe-input" [(ngModel)]="draft.to" />
          <button class="wfe-btn-primary" (click)="save()">Add</button>
        </div>
      </div>
      <div class="wfe-card p-4">
        <table class="w-full text-sm">
          <thead class="text-xs text-gray-500 uppercase">
            <tr>
              <th class="text-left">From</th>
              <th class="text-left">To</th>
              <th class="text-left">Active</th>
              <th class="text-left">Window</th>
            </tr>
          </thead>
          <tbody>
            @for (d of delegations(); track d.id) {
              <tr class="border-t">
                <td class="py-1.5">{{ userName(d.fromUserId) }}</td>
                <td>{{ userName(d.toUserId) }}</td>
                <td>
                  <input
                    type="checkbox"
                    [checked]="d.active"
                    (change)="toggle(d, $any($event.target).checked)"
                  />
                </td>
                <td class="text-xs text-gray-500">{{ d.from }} → {{ d.to }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="py-4 text-center text-gray-400">No delegations.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DelegationAdminPage {
  private api = inject(ActorsApi);
  users = signal<User[]>([]);
  delegations = signal<Delegation[]>([]);
  draft: Partial<Delegation> = { fromUserId: '', toUserId: '', from: '', to: '', active: true };

  constructor() {
    this.reload();
  }
  reload() {
    this.api.users().subscribe((u) => this.users.set(u));
    this.api.delegations().subscribe((d) => this.delegations.set(d));
  }
  userName(id: string) {
    return this.users().find((u) => u.id === id)?.displayName ?? id;
  }
  save() {
    if (!this.draft.fromUserId || !this.draft.toUserId) return;
    const d: Delegation = {
      id: 'd-' + Date.now(),
      fromUserId: this.draft.fromUserId!,
      toUserId: this.draft.toUserId!,
      from: this.draft.from!,
      to: this.draft.to!,
      active: true,
    };
    this.api.upsertDelegation(d);
    this.draft = { fromUserId: '', toUserId: '', from: '', to: '', active: true };
    this.reload();
  }
  toggle(d: Delegation, active: boolean) {
    this.api.upsertDelegation({ ...d, active });
    this.reload();
  }
}
