import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { TenantStore } from '../../core/tenancy/tenant.store';
import { I18nStore } from '../../core/i18n/i18n.store';
import { TranslatePipe } from '../pipes/translate.pipe';
import { NetworkStatusService } from '../../features/mobile/services/network-status.service';
import { InstancesApi } from '../../data/instances.api';
import { TasksApi } from '../../data/tasks.api';
import { NotificationService } from '../../data/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  key: string;
  badge?: () => number;
  matchExact?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <div class="flex h-screen text-slate-100">
      <aside
        class="w-64 shrink-0 flex flex-col relative overflow-hidden"
        style="background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);"
      >
        <div
          class="absolute inset-0 opacity-40 pointer-events-none"
          style="background:
            radial-gradient(circle at 20% 10%, rgba(139,92,246,.35) 0, transparent 40%),
            radial-gradient(circle at 80% 90%, rgba(236,72,153,.25) 0, transparent 40%);"
        ></div>

        <div class="relative px-4 py-5 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center"
              style="background: linear-gradient(135deg,#6366f1,#ec4899);"
            >
              <i class="bi bi-diagram-3-fill text-white text-lg"></i>
            </div>
            <div>
              <div class="text-sm font-bold tracking-tight">Workflow Engine</div>
              <div class="text-[10px] text-slate-400 uppercase tracking-wider">
                Enterprise Middleware
              </div>
            </div>
          </div>
        </div>

        <div class="relative px-3 pt-3 pb-2 text-xs text-slate-300 uppercase tracking-wider">
          Workspace
        </div>
        <nav class="relative flex-1 overflow-y-auto px-2 space-y-0.5">
          @for (item of nav; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-white/10 text-white shadow-inner"
              [routerLinkActiveOptions]="{ exact: !!item.matchExact }"
              class="group flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
            >
              <i class="bi {{ item.icon }} text-base w-5"></i>
              <span class="flex-1">{{ item.key | t }}</span>
              @if (item.badge && item.badge()! > 0) {
                <span
                  class="wfe-chip wfe-chip-solid"
                  style="background: rgba(236,72,153,.25); color:#fbcfe8;"
                >
                  {{ item.badge!() }}
                </span>
              }
            </a>
          }
        </nav>

        <div class="relative p-3 border-t border-white/10 space-y-2 text-xs">
          <div class="flex items-center gap-2 text-slate-300">
            <span
              class="wfe-dot"
              [style.background]="online() ? '#22c55e' : '#ef4444'"
              [class.wfe-active-pulse]="online()"
            ></span>
            <span>{{ online() ? 'Online' : 'Offline' }}</span>
            <span class="ml-auto text-[10px] text-slate-400">v0.2</span>
          </div>
          <label class="text-[10px] uppercase text-slate-400 tracking-wider">Department</label>
          <select
            class="w-full bg-white/10 text-white rounded px-2 py-1 text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            [value]="tenant.active()?.id"
            (change)="onTenant($any($event.target).value)"
          >
            @for (d of tenant.departments(); track d.id) {
              <option class="text-slate-900" [value]="d.id">{{ d.name }}</option>
            }
          </select>
        </div>
      </aside>

      <div class="flex-1 flex flex-col overflow-hidden">
        <header
          class="h-14 bg-white border-b border-slate-200 flex items-center px-5 justify-between shrink-0"
        >
          <div class="flex items-center gap-3">
            <span class="wfe-chip wfe-chip-accent">{{ tenant.active()?.name }}</span>
            <span class="text-xs text-slate-400">Signed in as</span>
            <a routerLink="/profile" class="text-sm font-medium text-indigo-600 hover:underline">{{ user()?.displayName }}</a>
            <span class="wfe-chip wfe-chip-neutral">{{ user()?.roles?.[0] }}</span>
          </div>
          <div class="flex items-center gap-2">
            <select
              class="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
              [value]="i18n.lang()"
              (change)="i18n.setLang($any($event.target).value)"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
            </select>
            <button class="wfe-btn wfe-btn-ghost text-xs" (click)="reset()" title="Reset demo data">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
            <button class="wfe-btn wfe-btn-outline text-xs" (click)="logout()">
              <i class="bi bi-box-arrow-right"></i>
              <span>Sign out</span>
            </button>
          </div>
        </header>
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  private auth = inject(AuthStore);
  private instancesApi = inject(InstancesApi);
  private tasksApi = inject(TasksApi);
  private notifyApi = inject(NotificationService);
  tenant = inject(TenantStore);
  i18n = inject(I18nStore);
  private net = inject(NetworkStatusService);

  online = computed(() => this.net.online());
  user = this.auth.user;

  nav: NavItem[] = [
    { route: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard', key: 'nav.dashboard' },
    {
      route: '/monitor',
      icon: 'bi-broadcast',
      label: 'Activity Monitor',
      key: 'nav.monitor',
      badge: () => 0, // Requires observable conversion if used
    },
    {
      route: '/definitions',
      icon: 'bi-bezier2',
      label: 'Workflow studio',
      key: 'Workflow studio',
    },
    { route: '/rules', icon: 'bi-diamond-fill', label: 'Rule Library', key: 'nav.rules' },
    { route: '/forms', icon: 'bi-file-earmark-text-fill', label: 'Forms', key: 'nav.forms' },
    {
      route: '/inbox',
      icon: 'bi-inbox-fill',
      label: 'Task Inbox',
      key: 'nav.inbox',
      badge: () => 0,
    },
    {
      route: '/notifications',
      icon: 'bi-bell-fill',
      label: 'Notifications',
      key: 'nav.notifications',
      badge: () => 0,
    },
    {
      route: '/needs-attention',
      icon: 'bi-exclamation-diamond-fill',
      label: 'Needs Attention',
      key: 'nav.needs_attention',
      badge: () => 0,
    },
    { route: '/migration', icon: 'bi-arrow-left-right', label: 'Migration', key: 'nav.migration' },
    { route: '/admin', icon: 'bi-gear-fill', label: 'Admin', key: 'nav.admin' },
    { route: '/mobile', icon: 'bi-phone', label: 'Field', key: 'nav.mobile' },
  ];

  logout() {
    this.auth.logout();
    location.href = '/login';
  }

  onTenant(id: string) {
    this.tenant.setActive(id);
  }

  reset() {
    if (confirm('Reset not supported with backend APIs')) {
    }
  }
}
