import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrganizationsApiService } from '../../../data/api/organizations-api.service';
import { OrganizationDto } from '../../../data/api/api-models';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AdminShellComponent } from '../admin-shell.component';

@Component({
  selector: 'tenant-detail-page',
  standalone: true,
  imports: [AdminShellComponent, FormsModule, CommonModule, RouterLink],
  template: `
    <admin-shell />
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <a routerLink="/admin/tenants" class="text-xs text-indigo-600 hover:underline mb-2 inline-block">
            <i class="bi bi-arrow-left"></i> Back to Tenants
          </a>
          <h1 class="wfe-page-title">Tenant Details</h1>
          <p class="wfe-page-subtitle">View and edit organization information.</p>
        </div>
        <div>
          <span class="wfe-chip" [ngClass]="tenant()?.isActive ? 'wfe-chip-success' : 'wfe-chip-neutral'">
            {{ tenant()?.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>

      @if (loading()) {
        <div class="wfe-card p-10 text-center text-slate-500">
          <i class="bi bi-arrow-repeat animate-spin text-2xl"></i>
          <p class="mt-2">Loading tenant...</p>
        </div>
      } @else if (tenant()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="wfe-card p-6 space-y-5">
            <h2 class="text-lg font-semibold text-slate-800">Organization Information</h2>
            <div>
              <label class="wfe-label">Code</label>
              <input class="wfe-input bg-slate-100" [value]="tenant()?.code" readonly disabled />
              <p class="text-xs text-slate-400 mt-1">Organization code cannot be changed.</p>
            </div>
            <div>
              <label class="wfe-label">Name</label>
              <input class="wfe-input" [(ngModel)]="editData.name" />
            </div>
            <div class="flex items-center gap-2 mt-4">
              <input type="checkbox" id="isActiveCheck" [(ngModel)]="editData.isActive" />
              <label for="isActiveCheck" class="text-sm font-medium text-slate-700">Organization Active</label>
            </div>
            <div class="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button class="wfe-btn wfe-btn-danger wfe-btn-outline" (click)="deleteTenant()">
                Delete Tenant
              </button>
              <button class="wfe-btn wfe-btn-primary" [disabled]="saving()" (click)="save()">
                @if (saving()) {
                  <i class="bi bi-arrow-repeat animate-spin"></i>
                }
                Save Changes
              </button>
            </div>
          </div>
          <div class="space-y-6">
            <div class="wfe-card p-5">
              <h2 class="text-lg font-semibold text-slate-800 mb-3">System Info</h2>
              <div class="space-y-3">
                <div>
                  <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant ID</div>
                  <div class="text-sm font-mono text-slate-700 bg-slate-50 p-2 rounded mt-1 border border-slate-100">
                    {{ tenant()?.id }}
                  </div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</div>
                  <div class="text-sm text-slate-700">
                    {{ tenant()?.createdAt | date:'medium' }}
                  </div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</div>
                  <div class="text-sm text-slate-700">
                    {{ tenant()?.updatedAt | date:'medium' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="wfe-card p-10 text-center text-slate-500">
          <p>Tenant not found.</p>
        </div>
      }
    </div>
  `
})
export class TenantDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orgsApi = inject(OrganizationsApiService);
  private toast = inject(ToastService);

  tenant = signal<OrganizationDto | null>(null);
  loading = signal(false);
  saving = signal(false);

  editData = {
    name: '',
    isActive: true
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadTenant(id);
      }
    });
  }

  loadTenant(id: string) {
    this.loading.set(true);
    this.orgsApi.findOne(id).subscribe({
      next: (org) => {
        this.tenant.set(org);
        this.editData.name = org.name;
        this.editData.isActive = org.isActive;
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Failed to load tenant');
        this.loading.set(false);
      }
    });
  }

  save() {
    const current = this.tenant();
    if (!current) return;

    this.saving.set(true);
    this.orgsApi.update(current.id, {
      name: this.editData.name,
      isActive: this.editData.isActive
    }).subscribe({
      next: (updatedOrg) => {
        this.tenant.set(updatedOrg);
        this.toast.success('Tenant updated successfully');
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update tenant');
        this.saving.set(false);
      }
    });
  }

  deleteTenant() {
    const current = this.tenant();
    if (!current) return;

    if (confirm(`Are you sure you want to permanently delete ${current.name}? This action cannot be undone.`)) {
      this.orgsApi.remove(current.id).subscribe({
        next: () => {
          this.toast.success('Tenant deleted');
          this.router.navigate(['/admin/tenants']);
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to delete tenant')
      });
    }
  }
}
