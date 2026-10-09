import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="flex gap-2 border-b bg-white px-4 sticky top-0 z-10">
      @for (t of tabs; track t.path) {
        <a
          [routerLink]="t.path"
          routerLinkActive="text-indigo-700 border-b-2 border-indigo-600"
          class="px-3 py-2 text-sm text-gray-600 hover:text-indigo-700"
        >
          <i class="bi {{ t.icon }} mr-1"></i>{{ t.label }}
        </a>
      }
    </div>
  `,
})
export class AdminShellComponent {
  tabs = [
    { path: '/admin/actors', icon: 'bi-people', label: 'Actors & Roles' },
    { path: '/admin/delegation', icon: 'bi-arrow-left-right', label: 'Delegation' },
    { path: '/admin/escalations', icon: 'bi-arrow-up-square', label: 'Escalations' },
    { path: '/admin/calendars', icon: 'bi-calendar-week', label: 'Calendars' },
    { path: '/admin/tenants', icon: 'bi-building', label: 'Tenants' },
    { path: '/admin/actions', icon: 'bi-lightning-charge', label: 'Actions' },
  ];
}
