import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InstancesApi } from '../../data/instances.api';
import { DefinitionsApi } from '../../data/definitions.api';
import { WorkflowInstance, InstanceStatus } from '../../domain/runtime';
import { WorkflowDefinition } from '../../domain/definition';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'instances-list-page',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, RelativeTimePipe],
  template: `
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <h1 class="wfe-page-title">Workflow Instances</h1>
          <p class="wfe-page-subtitle">View cases by selecting a definition below.</p>
        </div>
        @if (selectedDefId) {
          <a class="wfe-btn wfe-btn-soft" [routerLink]="['/definitions', selectedDefId]">
            <i class="bi bi-grid-1x2"></i> Workflow hub
          </a>
        }
      </div>

      <div class="wfe-card p-5 mb-5 space-y-4">
        <h2 class="text-lg font-semibold text-slate-800">Filter Instances</h2>
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="wfe-label">Definition</label>
            <select class="wfe-select" [(ngModel)]="selectedDefId" (change)="loadInstances()">
              <option value="">-- Select a Workflow Definition --</option>
              @for (def of definitions(); track def.id) {
                <option [value]="def.id">{{ def.name }} ({{ def.code }})</option>
              }
            </select>
          </div>
          <div class="flex-1">
            <label class="wfe-label">Status</label>
            <select class="wfe-select" [(ngModel)]="statusFilter" (change)="loadInstances()">
              <option value="all">All statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
              <option value="needs_attention">Waiting</option>
            </select>
          </div>
        </div>
      </div>

      <div class="wfe-card overflow-hidden">
        <table class="wfe-table">
          <thead>
            <tr>
              <th>Business Key</th>
              <th>Status</th>
              <th>Started At</th>
              <th>Completed At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (inst of filteredInstances(); track inst.id) {
              <tr>
                <td class="font-mono font-medium text-indigo-600">
                  <a [routerLink]="['/instances', inst.id]" [queryParams]="{ defId: selectedDefId }">{{ inst.code || inst.id }}</a>
                </td>
                <td>
                  <span class="wfe-chip" [ngClass]="statusChip(inst.status)">{{ inst.status }}</span>
                </td>
                <td class="text-sm text-slate-500">{{ inst.startedAt | relTime }}</td>
                <td class="text-sm text-slate-500">{{ inst.completedAt ? (inst.completedAt | relTime) : '-' }}</td>
                <td>
                  <a [routerLink]="['/instances', inst.id]" [queryParams]="{ defId: selectedDefId }" class="text-indigo-600 text-sm font-medium hover:underline">View</a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="wfe-empty !py-10">
                  <i class="bi bi-collection-play"></i>
                  @if (!selectedDefId) {
                    Select a definition to view its instances.
                  } @else {
                    No instances found for the selected criteria.
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class InstancesListPage implements OnInit {
  private instancesApi = inject(InstancesApi);
  private defsApi = inject(DefinitionsApi);

  definitions = signal<WorkflowDefinition[]>([]);
  instances = signal<WorkflowInstance[]>([]);
  
  selectedDefId = '';
  statusFilter: InstanceStatus | 'all' = 'all';

  ngOnInit() {
    this.defsApi.list().subscribe(defs => this.definitions.set(defs));
  }

  loadInstances() {
    if (!this.selectedDefId) {
      this.instances.set([]);
      return;
    }
    this.instancesApi.list({ definitionId: this.selectedDefId, status: this.statusFilter }).subscribe(list => {
      this.instances.set(list);
    });
  }

  filteredInstances() {
    return this.instances();
  }

  statusChip(status: string) {
    switch (status) {
      case 'running': return 'wfe-chip-info';
      case 'completed': return 'wfe-chip-success';
      case 'failed':
      case 'needs_attention': return 'wfe-chip-danger';
      case 'cancelled': return 'wfe-chip-neutral';
      default: return 'wfe-chip-neutral';
    }
  }
}
