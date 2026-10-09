import { Component, computed, inject } from '@angular/core';
import { AdminShellComponent } from '../admin/admin-shell.component';

@Component({
  selector: 'monitor-page',
  standalone: true,
  imports: [AdminShellComponent],
  template: `
    <admin-shell />
    <div class="wfe-page">
      <h1 class="wfe-page-title">System Monitor</h1>
      <p>Monitor metrics loading from backend...</p>
    </div>
  `
})
export class MonitorPage {
}
