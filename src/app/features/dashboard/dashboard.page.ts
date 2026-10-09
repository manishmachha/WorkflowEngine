import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { AuthStore } from '../../core/auth/auth.store';
import { SchedulerService } from '../../data/scheduler.service';
import { InstancesApi } from '../../data/instances.api';
import { TasksApi } from '../../data/tasks.api';

@Component({
  selector: 'dashboard-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <h1 class="wfe-page-title">Command Center</h1>
          <p class="wfe-page-subtitle">
            Live view of running instances, task inbox pressure, and scheduler activity.
          </p>
        </div>
      </div>
      <div class="wfe-card p-5 mt-4">
        Dashboard is loading data from backend APIs...
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class DashboardPage {
  scheduler = inject(SchedulerService);
  auth = inject(AuthStore);
  private instancesApi = inject(InstancesApi);
  private tasksApi = inject(TasksApi);
}
