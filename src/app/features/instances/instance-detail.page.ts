import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InstancesApi } from '../../data/instances.api';
import { WorkflowInstance } from '../../domain/runtime';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { WorkflowInstancesApiService } from '../../data/api/workflow-instances-api.service';
import { AuthStore } from '../../core/auth/auth.store';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'instance-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, RelativeTimePipe],
  template: `
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <a routerLink="/instances" class="text-xs text-indigo-600 hover:underline mb-2 inline-block">
            <i class="bi bi-arrow-left"></i> Back to Instances
          </a>
          <h1 class="wfe-page-title">Instance {{ instance()?.code || instance()?.id }}</h1>
          <p class="wfe-page-subtitle">Details, state, and logs for this case.</p>
        </div>
        <div class="flex gap-2">
          <span class="wfe-chip" [ngClass]="statusChip(instance()?.status)">
            {{ instance()?.status || 'Loading...' }}
          </span>
        </div>
      </div>

      @if (loading()) {
        <div class="wfe-card p-10 text-center text-slate-500">
          <i class="bi bi-arrow-repeat animate-spin text-2xl"></i>
          <p class="mt-2">Loading instance...</p>
        </div>
      } @else if (instance()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="wfe-card p-5 md:col-span-2 space-y-4">
            <h2 class="text-lg font-semibold text-slate-800">State Info</h2>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="block text-xs text-slate-500">ID</span>
                <span class="font-mono text-slate-800">{{ instance()?.id }}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-500">Definition ID</span>
                <span class="font-mono text-slate-800">{{ instance()?.definitionId }}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-500">Started By</span>
                <span class="font-mono text-slate-800">{{ instance()?.initiatorUserId }}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-500">Started At</span>
                <span class="text-slate-800">{{ instance()?.startedAt | date:'medium' }}</span>
              </div>
            </div>

            <hr class="border-slate-100" />
            <h2 class="text-lg font-semibold text-slate-800">Variables</h2>
            <pre class="bg-slate-50 p-3 rounded font-mono text-xs overflow-x-auto text-slate-700">{{ instance()?.variables | json }}</pre>
          </div>

          <div class="space-y-6">
            <div class="wfe-card p-5">
              <h2 class="text-lg font-semibold text-slate-800 mb-3">Quick Actions</h2>
              <div class="space-y-2">
                @if (instance()?.status === 'running' || instance()?.status === 'needs_attention') {
                  <button class="wfe-btn wfe-btn-ghost w-full justify-start text-red-600 hover:bg-red-50" (click)="abortInstance()">
                    <i class="bi bi-x-circle"></i> Abort Case
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="wfe-card p-10 text-center text-slate-500">
          <p>Instance not found or missing Definition ID in URL.</p>
        </div>
      }
    </div>
  `
})
export class InstanceDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private realApi = inject(WorkflowInstancesApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthStore);

  instance = signal<WorkflowInstance | null>(null);
  loading = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const defId = this.route.snapshot.queryParamMap.get('defId');
      if (id && defId) {
        this.loadInstance(defId, id);
      } else {
        this.toast.error('Definition ID is required in query params');
      }
    });
  }

  loadInstance(defId: string, id: string) {
    this.loading.set(true);
    this.realApi.findOne(defId, id).subscribe({
      next: (res) => {
        this.instance.set({
          id: res.id,
          definitionId: defId,
          definitionVersion: 1,
          code: res.businessKey || res.id,
          entityRef: { type: 'case', id: res.id },
          status: this.mapStatus(res.status),
          currentNodeIds: [],
          initiatorUserId: res.startedById,
          tenantId: res.organizationId,
          priority: 'normal',
          startedAt: res.startedAt,
          completedAt: res.completedAt || undefined,
          version: 1,
          variables: {} // Real API does not expose variables on root level yet
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to load instance');
        this.loading.set(false);
      }
    });
  }

  abortInstance() {
    this.toast.error('Abort not implemented in backend yet');
  }

  statusChip(status: string | undefined) {
    switch (status) {
      case 'running': return 'wfe-chip-info';
      case 'completed': return 'wfe-chip-success';
      case 'failed':
      case 'needs_attention': return 'wfe-chip-danger';
      case 'cancelled': return 'wfe-chip-neutral';
      default: return 'wfe-chip-neutral';
    }
  }

  private mapStatus(backendStatus: string): any {
    switch (backendStatus) {
      case 'RUNNING': return 'running';
      case 'COMPLETED': return 'completed';
      case 'CANCELLED': return 'cancelled';
      case 'FAILED': return 'failed';
      case 'WAITING': return 'needs_attention';
      default: return 'running';
    }
  }
}
