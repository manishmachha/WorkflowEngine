import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsersApiService } from '../../../data/api/users-api.service';
import { RolesApiService } from '../../../data/api/roles-api.service';
import { OrganizationsApiService } from '../../../data/api/organizations-api.service';
import { PermissionsApiService } from '../../../data/api/permissions-api.service';
import { UserDto, RoleDto, OrganizationDto, PermissionDto } from '../../../data/api/api-models';
import { AdminShellComponent } from '../admin-shell.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'actors-admin-page',
  standalone: true,
  imports: [AdminShellComponent, FormsModule, CommonModule, RouterLink],
  template: `
    <admin-shell />
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <h1 class="wfe-page-title">Actors (Users & Roles)</h1>
          <p class="wfe-page-subtitle">Manage users and roles within your organizations.</p>
        </div>
      </div>

      <div class="flex gap-4 mb-5 border-b border-slate-200">
        <button class="px-4 py-2 text-sm font-medium border-b-2 transition" 
          [ngClass]="activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
          (click)="activeTab = 'users'">Users</button>
        <button class="px-4 py-2 text-sm font-medium border-b-2 transition"
          [ngClass]="activeTab === 'roles' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
          (click)="activeTab = 'roles'">Roles</button>
      </div>

      <!-- USERS TAB -->
      @if (activeTab === 'users') {
        <div class="mb-4">
          <button class="wfe-btn wfe-btn-primary" (click)="showUserForm = !showUserForm">
            <i class="bi bi-person-plus"></i> New User
          </button>
        </div>

        @if (showUserForm) {
          <div class="wfe-card p-5 mb-5 space-y-4 max-w-xl border-l-4 border-indigo-500">
            <h2 class="text-lg font-semibold text-slate-800">Add New User</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="wfe-label">First Name</label>
                <input class="wfe-input" [(ngModel)]="newUser.firstName" />
              </div>
              <div>
                <label class="wfe-label">Last Name</label>
                <input class="wfe-input" [(ngModel)]="newUser.lastName" />
              </div>
            </div>
            <div>
              <label class="wfe-label">Email</label>
              <input class="wfe-input" type="email" [(ngModel)]="newUser.email" />
            </div>
            <div>
              <label class="wfe-label">Password</label>
              <input class="wfe-input" type="password" [(ngModel)]="newUser.password" />
            </div>
            <div>
              <label class="wfe-label">Organization</label>
              <select class="wfe-select" [(ngModel)]="newUser.organizationId">
                <option value="">Select Organization</option>
                @for (org of organizations(); track org.id) {
                  <option [value]="org.id">{{ org.name }}</option>
                }
              </select>
            </div>
            <div class="flex gap-2 pt-2">
              <button class="wfe-btn wfe-btn-primary" (click)="saveUser()">Save User</button>
              <button class="wfe-btn wfe-btn-ghost" (click)="showUserForm = false">Cancel</button>
            </div>
          </div>
        }

        <div class="wfe-card overflow-hidden">
          <table class="wfe-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Organization</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td class="font-medium text-slate-800">
                    <a [routerLink]="['/admin/actors/users', user.id]" class="text-indigo-600 hover:underline">
                      {{ user.firstName }} {{ user.lastName }}
                    </a>
                  </td>
                  <td class="text-sm text-slate-600">{{ user.email }}</td>
                  <td class="text-sm text-slate-600">{{ getOrgName(user.organizationId) }}</td>
                  <td>
                    <span class="wfe-chip" [ngClass]="user.isActive ? 'wfe-chip-success' : 'wfe-chip-neutral'">
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="text-indigo-600 hover:text-indigo-800 text-sm font-medium" (click)="toggleUserActive(user)">
                      {{ user.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="wfe-empty !py-8">No users found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ROLES TAB -->
      @if (activeTab === 'roles') {
        <div class="mb-4">
          <button class="wfe-btn wfe-btn-primary" (click)="showRoleForm = !showRoleForm">
            <i class="bi bi-shield-plus"></i> New Role
          </button>
        </div>

        @if (showRoleForm) {
          <div class="wfe-card p-5 mb-5 space-y-4 max-w-xl border-l-4 border-indigo-500">
            <h2 class="text-lg font-semibold text-slate-800">Add New Role</h2>
            <div>
              <label class="wfe-label">Name</label>
              <input class="wfe-input" [(ngModel)]="newRole.name" placeholder="e.g. Case Worker" />
            </div>
            <div>
              <label class="wfe-label">Code</label>
              <input class="wfe-input" [(ngModel)]="newRole.code" placeholder="CASE_WORKER" />
            </div>
            <div>
              <label class="wfe-label">Description</label>
              <input class="wfe-input" [(ngModel)]="newRole.description" />
            </div>
            <div>
              <label class="wfe-label">Permissions</label>
              <div class="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded p-2">
                @for (perm of permissions(); track perm.id) {
                  <label class="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" 
                           [checked]="newRole.permissionIds.includes(perm.id)"
                           (change)="togglePermission(perm.id)" />
                    <span>{{ perm.name }} ({{ perm.code }})</span>
                  </label>
                } @empty {
                  <p class="text-xs text-slate-400">No permissions available.</p>
                }
              </div>
            </div>
            <div class="flex gap-2 pt-2">
              <button class="wfe-btn wfe-btn-primary" (click)="saveRole()">Save Role</button>
              <button class="wfe-btn wfe-btn-ghost" (click)="showRoleForm = false">Cancel</button>
            </div>
          </div>
        }

        <div class="wfe-card overflow-hidden">
          <table class="wfe-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Description</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (role of roles(); track role.id) {
                <tr>
                  <td class="font-mono text-sm font-semibold text-slate-700">{{ role.code }}</td>
                  <td class="text-sm font-medium text-slate-800">
                    <a [routerLink]="['/admin/actors/roles', role.id]" class="text-indigo-600 hover:underline">
                      {{ role.name }}
                    </a>
                  </td>
                  <td class="text-sm text-slate-600">{{ role.description }}</td>
                  <td>
                    <span class="wfe-chip" [ngClass]="role.isActive ? 'wfe-chip-success' : 'wfe-chip-neutral'">
                      {{ role.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="text-indigo-600 hover:text-indigo-800 text-sm font-medium" (click)="toggleRoleActive(role)">
                      {{ role.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="wfe-empty !py-8">No roles found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>
  `
})
export class ActorsAdminPage implements OnInit {
  private usersApi = inject(UsersApiService);
  private rolesApi = inject(RolesApiService);
  private orgsApi = inject(OrganizationsApiService);
  private permsApi = inject(PermissionsApiService);
  private toast = inject(ToastService);

  activeTab: 'users' | 'roles' = 'users';

  users = signal<UserDto[]>([]);
  roles = signal<RoleDto[]>([]);
  organizations = signal<OrganizationDto[]>([]);
  permissions = signal<PermissionDto[]>([]);

  showUserForm = false;
  newUser = { firstName: '', lastName: '', email: '', password: '', organizationId: '' };

  showRoleForm = false;
  newRole: { name: string; code: string; description: string; permissionIds: string[] } = { name: '', code: '', description: '', permissionIds: [] };

  ngOnInit() {
    this.orgsApi.findAll().subscribe(orgs => {
      this.organizations.set(orgs);
      if (orgs.length > 0) {
        this.loadUsers(orgs[0].id); // For simplicity, load users from first org initially
      }
    });
    this.loadRoles();
    this.loadPermissions();
  }

  loadPermissions() {
    this.permsApi.findAll().subscribe(perms => this.permissions.set(perms));
  }

  loadUsers(orgId: string) {
    this.usersApi.getByOrganizationId(orgId).subscribe(users => this.users.set(users));
  }

  loadRoles() {
    this.rolesApi.findAll().subscribe(roles => this.roles.set(roles));
  }

  getOrgName(id: string) {
    return this.organizations().find(o => o.id === id)?.name || id;
  }

  saveUser() {
    if (!this.newUser.email || !this.newUser.organizationId) {
      this.toast.error('Email and Organization are required');
      return;
    }
    this.usersApi.create(this.newUser).subscribe({
      next: () => {
        this.toast.success('User created');
        this.showUserForm = false;
        this.newUser = { firstName: '', lastName: '', email: '', password: '', organizationId: '' };
        this.loadUsers(this.organizations()[0].id);
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Failed to create user')
    });
  }

  toggleUserActive(user: UserDto) {
    this.usersApi.update(user.id, { isActive: !user.isActive }).subscribe({
      next: () => {
        this.toast.success('User updated');
        this.loadUsers(user.organizationId);
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Failed to update user')
    });
  }

  togglePermission(id: string) {
    const ids = this.newRole.permissionIds;
    if (ids.includes(id)) {
      this.newRole.permissionIds = ids.filter(pid => pid !== id);
    } else {
      this.newRole.permissionIds.push(id);
    }
  }

  saveRole() {
    if (!this.newRole.code || !this.newRole.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.rolesApi.create({
      code: this.newRole.code,
      name: this.newRole.name,
      description: this.newRole.description,
      permissionIds: this.newRole.permissionIds
    }).subscribe({
      next: () => {
        this.toast.success('Role created');
        this.showRoleForm = false;
        this.newRole = { name: '', code: '', description: '', permissionIds: [] };
        this.loadRoles();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Failed to create role')
    });
  }

  toggleRoleActive(role: RoleDto) {
    this.rolesApi.update(role.id, { isActive: !role.isActive }).subscribe({
      next: () => {
        this.toast.success('Role updated');
        this.loadRoles();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Failed to update role')
    });
  }
}
