import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActorsApi } from '../../../data/actors.api';
import { HolidayCalendar } from '../../../domain/actors';
import { AdminShellComponent } from '../admin-shell.component';

@Component({
  selector: 'calendars-admin',
  standalone: true,
  imports: [FormsModule, AdminShellComponent],
  template: `
    <admin-shell />
    <div class="wfe-page">
      <h1 class="wfe-page-title">Holiday Calendars</h1>
      @for (c of calendars(); track c.id) {
        <div class="wfe-card p-4 mb-3">
          <div class="flex items-center gap-2 mb-3">
            <input
              class="wfe-input max-w-xs"
              [ngModel]="c.name"
              (ngModelChange)="update(c, { name: $event })"
            />
            <input
              class="wfe-input max-w-xs"
              [ngModel]="c.timezone"
              (ngModelChange)="update(c, { timezone: $event })"
            />
          </div>
          <table class="w-full text-sm">
            <thead class="text-xs text-gray-500 uppercase">
              <tr>
                <th class="text-left">Date</th>
                <th class="text-left">Label</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (h of c.holidays; track $index) {
                <tr class="border-t">
                  <td class="py-1">{{ h.date }}</td>
                  <td>{{ h.label }}</td>
                  <td class="text-right">
                    <button class="text-red-600 text-xs" (click)="removeHoliday(c, $index)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <div class="flex gap-2 mt-2 text-xs">
            <input type="date" class="wfe-input py-1" [(ngModel)]="draft.date" />
            <input class="wfe-input py-1" placeholder="Label" [(ngModel)]="draft.label" />
            <button class="wfe-btn-primary" (click)="addHoliday(c)">Add</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CalendarsAdminPage {
  private api = inject(ActorsApi);
  calendars = signal<HolidayCalendar[]>([]);
  draft = { date: '', label: '' };
  constructor() {
    this.reload();
  }
  reload() {
    this.api.calendars().subscribe((c) => this.calendars.set(c));
  }
  update(c: HolidayCalendar, patch: Partial<HolidayCalendar>) {
    this.api.upsertCalendar({ ...c, ...patch });
    this.reload();
  }
  addHoliday(c: HolidayCalendar) {
    if (!this.draft.date) return;
    this.api.upsertCalendar({ ...c, holidays: [...c.holidays, { ...this.draft }] });
    this.draft = { date: '', label: '' };
    this.reload();
  }
  removeHoliday(c: HolidayCalendar, i: number) {
    this.api.upsertCalendar({ ...c, holidays: c.holidays.filter((_, j) => j !== i) });
    this.reload();
  }
}
