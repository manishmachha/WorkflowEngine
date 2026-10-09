import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RolesApiService } from '../../../data/api/roles-api.service';
import { PermissionsApiService } from '../../../data/api/permissions-api.service';
import { RoleDto, PermissionDto } from '../../../data/api/api-models';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AdminShellComponent } from '../admin-shell.component';

@Component({
  selector: 'role-detail-page',
  standalone: true,
  imports: [AdminShellComponent, FormsModule, CommonModule, RouterLink],
  template: `
    <admin-shell />
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <a routerLink="/admin/actors" class="text-xs text-indigo-600 hover:underline mb-2 inline-block">
            <i class="bi bi-arrow-left"></i> Back to Actors
          </a>
          <h1 class="wfe-page-title">Role Details</h1>
          <p class="wfe-page-subtitle">View and edit role information and permissions.</p>
        </div>
        <div>
          <span class="wfe-chip" [ngClass]="role()?.isActive ? 'wfe-chip-success' : 'wfe-chip-neutral'">
            {{ role()?.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>

      @if (loading()) {
        <div class="wfe-card p-10 text-center text-slate-500">
          <i class="bi bi-arrow-repeat animate-spin text-2xl"></i>
          <p class="mt-2">Loading role...</p>
        </div>
      } @else if (role()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="wfe-card p-6 space-y-5">
            <h2 class="text-lg font-semibold text-slate-800">Role Information</h2>
            <div>
              <label class="wfe-label">Code</label>
              <input class="wfe-input bg-slate-100" [value]="role()?.code" readonly disabled />
              <p class="text-xs text-slate-400 mt-1">Role code cannot be changed after creation.</p>
            </div>
            <div>
              <label class="wfe-label">Name</label>
              <input class="wfe-input" [(ngModel)]="editData.name" />
            </div>
            <div>
              <label class="wfe-label">Description</label>
              <textarea class="wfe-input" [(ngModel)]="editData.description"></textarea>
            </div>
            <div class="flex items-center gap-2 mt-4">
              <input type="checkbox" id="isActiveCheck" [(ngModel)]="editData.isActive" />
              <label for="isActiveCheck" class="text-sm font-medium text-slate-700">Role Active</label>
            </div>
            <div class="pt-4 border-t border-slate-100 flex justify-end">
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
              <h2 class="text-lg font-semibold text-slate-800 mb-3">Permissions</h2>
              <div class="space-y-2 max-h-96 overflow-y-auto">
                @for (perm of allPermissions(); track perm.id) {
                  <label class="flex items-center gap-2 text-sm text-slate-700 p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition">
                    <input type="checkbox" 
                           [checked]="editData.permissionIds.includes(perm.id)"
                           (change)="togglePermission(perm.id)" />
                    <div>
                      <div class="font-medium">{{ perm.name }} <span class="text-xs text-slate-500 font-mono">({{ perm.code }})</span></div>
                      <div class="text-xs text-slate-500">{{ perm.description }}</div>
                    </div>
                  </label>
                } @empty {
                  <p class="text-xs text-slate-400">No permissions available in the system.</p>
                }
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="wfe-card p-10 text-center text-slate-500">
          <p>Role not found.</p>
        </div>
      }
    </div>
  `
})
export class RoleDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private rolesApi = inject(RolesApiService);
  private permsApi = inject(PermissionsApiService);
  private toast = inject(ToastService);

  role = signal<RoleDto | null>(null);
  allPermissions = signal<PermissionDto[]>([]);
  
  loading = signal(false);
  saving = signal(false);

  editData = {
    name: '',
    description: '',
    isActive: true,
    permissionIds: [] as string[]
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadRoleAndPermissions(id);
      }
    });
  }

  loadRoleAndPermissions(id: string) {
    this.loading.set(true);
    
    // Load all available permissions
    this.permsApi.findAll().subscribe({
      next: (perms) => this.allPermissions.set(perms),
      error: () => this.toast.error('Failed to load permissions list')
    });

    // Load the role details
    this.rolesApi.findOne(id).subscribe({
      next: (role) => {
        this.role.set(role);
        this.editData.name = role.name;
        this.editData.description = role.description || '';
        this.editData.isActive = role.isActive;
        this.editData.permissionIds = role.permissions?.map(p => p.id) || [];
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Failed to load role');
        this.loading.set(false);
      }
    });
  }

  togglePermission(id: string) {
    const current = this.role();
    if (!current) return;

    if (this.editData.permissionIds.includes(id)) {
      this.editData.permissionIds = this.editData.permissionIds.filter(pid => pid !== id);
    } else {
      this.editData.permissionIds.push(id);
    }

    // Auto-save just the permissions on toggle
    this.rolesApi.update(current.id, {
      permissionIds: this.editData.permissionIds
    }).subscribe({
      next: (updatedRole) => {
        this.role.set(updatedRole);
        this.toast.success('Permissions updated');
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update permissions');
        // Revert UI check on error
        if (this.editData.permissionIds.includes(id)) {
          this.editData.permissionIds = this.editData.permissionIds.filter(pid => pid !== id);
        } else {
          this.editData.permissionIds.push(id);
        }
      }
    });
  }

  save() {
    const current = this.role();
    if (!current) return;

    this.saving.set(true);
    this.rolesApi.update(current.id, {
      name: this.editData.name,
      description: this.editData.description,
      isActive: this.editData.isActive,
      permissionIds: this.editData.permissionIds
    }).subscribe({
      next: (updatedRole) => {
        this.role.set(updatedRole);
        this.toast.success('Role updated successfully');
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update role');
        this.saving.set(false);
      }
    });
  }
}
