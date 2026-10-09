import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsersApiService } from '../../../data/api/users-api.service';
import { RolesApiService } from '../../../data/api/roles-api.service';
import { UserDto, UserRoleDto, RoleDto } from '../../../data/api/api-models';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AdminShellComponent } from '../admin-shell.component';

@Component({
  selector: 'user-detail-page',
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
          <h1 class="wfe-page-title">User Details</h1>
          <p class="wfe-page-subtitle">View and edit user information.</p>
        </div>
        <div>
          <span class="wfe-chip" [ngClass]="user()?.isActive ? 'wfe-chip-success' : 'wfe-chip-neutral'">
            {{ user()?.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>

      @if (loading()) {
        <div class="wfe-card p-10 text-center text-slate-500">
          <i class="bi bi-arrow-repeat animate-spin text-2xl"></i>
          <p class="mt-2">Loading user...</p>
        </div>
      } @else if (user()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="wfe-card p-6 md:col-span-2 space-y-5">
            <h2 class="text-lg font-semibold text-slate-800">Profile Information</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="wfe-label">First Name</label>
                <input class="wfe-input" [(ngModel)]="editData.firstName" />
              </div>
              <div>
                <label class="wfe-label">Last Name</label>
                <input class="wfe-input" [(ngModel)]="editData.lastName" />
              </div>
            </div>
            <div>
              <label class="wfe-label">Email</label>
              <input class="wfe-input bg-slate-100" [value]="user()?.email" readonly disabled />
            </div>
            <div>
              <label class="wfe-label">Phone Number</label>
              <input class="wfe-input" [(ngModel)]="editData.phoneNumber" />
            </div>
            <div class="flex items-center gap-2 mt-4">
              <input type="checkbox" id="isActiveCheck" [(ngModel)]="editData.isActive" />
              <label for="isActiveCheck" class="text-sm font-medium text-slate-700">Account Active</label>
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
              <h2 class="text-lg font-semibold text-slate-800 mb-3">Roles</h2>
              <div class="space-y-2 max-h-96 overflow-y-auto">
                @for (role of allRoles(); track role.id) {
                  <label class="flex items-center gap-2 text-sm text-slate-700 p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition">
                    <input type="checkbox" 
                           [checked]="hasRole(role.id)"
                           (change)="toggleRole(role.id)" />
                    <div>
                      <div class="font-medium">{{ role.name }} <span class="text-xs text-slate-500 font-mono">({{ role.code }})</span></div>
                      <div class="text-xs text-slate-500">{{ role.description }}</div>
                    </div>
                  </label>
                } @empty {
                  <p class="text-xs text-slate-400">No roles available in the system.</p>
                }
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="wfe-card p-10 text-center text-slate-500">
          <p>User not found.</p>
        </div>
      }
    </div>
  `
})
export class UserDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private usersApi = inject(UsersApiService);
  private rolesApi = inject(RolesApiService);
  private toast = inject(ToastService);

  user = signal<UserDto | null>(null);
  roles = signal<UserRoleDto[]>([]);
  allRoles = signal<RoleDto[]>([]);
  loading = signal(false);
  saving = signal(false);

  editData = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    isActive: true
  };

  newRoleId = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadUser(id);
      }
    });
    this.rolesApi.findAll().subscribe(roles => this.allRoles.set(roles));
  }

  loadUser(id: string) {
    this.loading.set(true);
    this.usersApi.getById(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.editData.firstName = user.firstName;
        this.editData.lastName = user.lastName;
        this.editData.phoneNumber = user.phoneNumber || '';
        this.editData.isActive = user.isActive;
        this.loadRoles(id);
      },
      error: (err) => {
        this.toast.error('Failed to load user');
        this.loading.set(false);
      }
    });
  }

  loadRoles(userId: string) {
    this.usersApi.getUserRoles(userId).subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  save() {
    const current = this.user();
    if (!current) return;

    this.saving.set(true);
    this.usersApi.update(current.id, {
      firstName: this.editData.firstName,
      lastName: this.editData.lastName,
      phoneNumber: this.editData.phoneNumber,
      isActive: this.editData.isActive
    }).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.toast.success('User updated successfully');
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update user');
        this.saving.set(false);
      }
    });
  }

  hasRole(roleId: string): boolean {
    return this.roles().some(ur => ur.roleId === roleId);
  }

  toggleRole(roleId: string) {
    const current = this.user();
    if (!current) return;

    if (this.hasRole(roleId)) {
      this.usersApi.removeRole(current.id, roleId).subscribe({
        next: () => {
          this.toast.success('Role removed');
          this.loadRoles(current.id);
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to remove role')
      });
    } else {
      this.usersApi.assignRole(current.id, { roleId }).subscribe({
        next: () => {
          this.toast.success('Role assigned');
          this.loadRoles(current.id);
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to assign role')
      });
    }
  }
}
