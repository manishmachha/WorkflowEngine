import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsersApiService } from '../../data/api/users-api.service';
import { UserDto } from '../../data/api/api-models';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'profile-page',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="wfe-page max-w-2xl mx-auto mt-10">
      <div class="wfe-page-header">
        <div>
          <h1 class="wfe-page-title">My Profile</h1>
          <p class="wfe-page-subtitle">Manage your personal information.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="wfe-card p-10 text-center text-slate-500">
          <i class="bi bi-arrow-repeat animate-spin text-2xl"></i>
          <p class="mt-2">Loading profile...</p>
        </div>
      } @else if (user()) {
        <div class="wfe-card p-6 space-y-5">
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
            <input class="wfe-input bg-slate-100 text-slate-500" [value]="user()?.email" readonly disabled />
            <p class="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <label class="wfe-label">Phone Number</label>
            <input class="wfe-input" [(ngModel)]="editData.phoneNumber" placeholder="+1 (555) 000-0000" />
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
      }
    </div>
  `
})
export class ProfilePage implements OnInit {
  private usersApi = inject(UsersApiService);
  private toast = inject(ToastService);

  user = signal<UserDto | null>(null);
  loading = signal(false);
  saving = signal(false);

  editData = {
    firstName: '',
    lastName: '',
    phoneNumber: ''
  };

  ngOnInit() {
    this.loading.set(true);
    this.usersApi.getMe().subscribe({
      next: (user) => {
        this.user.set(user);
        this.editData.firstName = user.firstName;
        this.editData.lastName = user.lastName;
        this.editData.phoneNumber = user.phoneNumber || '';
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Failed to load profile');
        this.loading.set(false);
      }
    });
  }

  save() {
    const current = this.user();
    if (!current) return;

    this.saving.set(true);
    this.usersApi.update(current.id, {
      firstName: this.editData.firstName,
      lastName: this.editData.lastName,
      phoneNumber: this.editData.phoneNumber
    }).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.toast.success('Profile updated successfully');
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update profile');
        this.saving.set(false);
      }
    });
  }
}
