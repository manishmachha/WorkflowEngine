import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InstancesApi } from '../../data/instances.api';
import { WorkflowInstance } from '../../domain/runtime';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'needs-attention-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="wfe-page">
      <h1 class="wfe-page-title">Needs Attention</h1>
      <p class="text-sm text-gray-600 mb-3">
        Dead-lettered instances from system-task failures. Retry, reassign, or abort with a
        reason.
      </p>
      <div class="wfe-card overflow-hidden">
        <table class="w-full text-sm text-black">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th class="text-left px-3 py-2">Instance</th>
              <th class="text-left px-3 py-2">Failed at node</th>
              <th class="text-left px-3 py-2">Priority</th>
              <th class="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (i of items(); track i.id) {
              <tr class="border-t">
                <td class="px-3 py-2">
                  <a [routerLink]="['/instances', i.id]" class="text-indigo-600 font-medium">{{
                    i.code
                  }}</a>
                </td>
                <td class="px-3 py-2 font-mono text-xs">{{ i.currentNodeIds.join(', ') }}</td>
                <td class="px-3 py-2">{{ i.priority }}</td>
                <td class="px-3 py-2 text-right whitespace-nowrap">
                  <button class="wfe-btn-ghost text-xs" (click)="retry(i)">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                  </button>
                  <button class="wfe-btn-danger text-xs" (click)="abort(i)">
                    <i class="bi bi-x-lg"></i> Abort
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-3 py-8 text-center text-gray-400">All clear.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class NeedsAttentionPage implements OnInit {
  private api = inject(InstancesApi);
  private toast = inject(ToastService);
  private auth = inject(AuthStore);
  items = signal<WorkflowInstance[]>([]);

  ngOnInit() {
    this.reload();
  }
  reload() {
    this.api.needsAttention().subscribe((v) => this.items.set(v));
  }
  retry(i: WorkflowInstance) {
    const uid = this.auth.user()?.id ?? 'system';
    this.api.retryFailed(i.id, uid).subscribe(() => {
      this.toast.success('Retried');
      this.reload();
    });
  }
  abort(i: WorkflowInstance) {
    const reason = prompt('Reason for aborting?') || 'no reason';
    const uid = this.auth.user()?.id ?? 'system';
    this.api.abort(i.id, reason, uid).subscribe(() => {
      this.toast.warn('Aborted');
      this.reload();
    });
  }
}
