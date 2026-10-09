import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrganizationsApiService } from '../../../data/api/organizations-api.service';
import { OrganizationDto } from '../../../data/api/api-models';
import { AdminShellComponent } from '../admin-shell.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'tenants-admin',
  standalone: true,
  imports: [AdminShellComponent, FormsModule, CommonModule, RouterLink],
  template: `
    <admin-shell />
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <h1 class="wfe-page-title">Tenants (Organizations)</h1>
          <p class="wfe-page-subtitle">Manage top-level organizations and departments.</p>
        </div>
        <button class="wfe-btn wfe-btn-primary" (click)="showForm = !showForm">
          <i class="bi bi-plus"></i> New Tenant
        </button>
      </div>

      @if (showForm) {
        <div class="wfe-card p-5 mb-5 space-y-4 max-w-xl border-l-4 border-indigo-500">
          <h2 class="text-lg font-semibold text-slate-800">Add New Tenant</h2>
          <div>
            <label class="wfe-label">Name</label>
            <input class="wfe-input" [(ngModel)]="newTenant.name" placeholder="e.g. Acme Corp" />
          </div>
          <div>
            <label class="wfe-label">Code</label>
            <input class="wfe-input" [(ngModel)]="newTenant.code" placeholder="ACME" />
          </div>
          <div class="flex gap-2">
            <button class="wfe-btn wfe-btn-primary" (click)="saveTenant()">Save</button>
            <button class="wfe-btn wfe-btn-ghost" (click)="showForm = false">Cancel</button>
          </div>
        </div>
      }

      <div class="wfe-card overflow-hidden">
        <table class="wfe-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Active</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (org of organizations(); track org.id) {
              <tr>
                <td class="font-mono text-sm font-semibold text-slate-700">{{ org.code }}</td>
                <td class="text-sm font-medium text-slate-800">
                  <a [routerLink]="['/admin/tenants', org.id]" class="text-indigo-600 hover:underline">
                    {{ org.name }}
                  </a>
                </td>
                <td>
                  <span class="wfe-chip" [ngClass]="org.isActive ? 'wfe-chip-success' : 'wfe-chip-neutral'">
                    {{ org.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-xs text-slate-500">{{ org.createdAt | date:'short' }}</td>
                <td>
                  <button class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-3" (click)="toggleActive(org)">
                    {{ org.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button class="text-red-600 hover:text-red-800 text-sm font-medium" (click)="deleteOrg(org)">
                    Delete
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="wfe-empty !py-8">
                  No organizations found.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TenantsAdminPage implements OnInit {
  private orgsApi = inject(OrganizationsApiService);
  private toast = inject(ToastService);

  organizations = signal<OrganizationDto[]>([]);
  showForm = false;
  newTenant = { name: '', code: '' };

  ngOnInit() {
    this.load();
  }

  load() {
    this.orgsApi.findAll().subscribe(orgs => this.organizations.set(orgs));
  }

  saveTenant() {
    if (!this.newTenant.name || !this.newTenant.code) {
      this.toast.error('Name and Code are required');
      return;
    }
    this.orgsApi.create({
      name: this.newTenant.name,
      code: this.newTenant.code,
      isActive: true
    }).subscribe({
      next: () => {
        this.toast.success('Tenant created successfully');
        this.showForm = false;
        this.newTenant = { name: '', code: '' };
        this.load();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Failed to create tenant')
    });
  }

  toggleActive(org: OrganizationDto) {
    this.orgsApi.update(org.id, { isActive: !org.isActive }).subscribe({
      next: () => {
        this.toast.success('Tenant status updated');
        this.load();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Failed to update tenant')
    });
  }

  deleteOrg(org: OrganizationDto) {
    if (confirm(`Are you sure you want to delete ${org.name}?`)) {
      this.orgsApi.remove(org.id).subscribe({
        next: () => {
          this.toast.success('Tenant deleted');
          this.load();
        },
        error: (err: any) => this.toast.error(err.error?.message || 'Failed to delete tenant')
      });
    }
  }
}
