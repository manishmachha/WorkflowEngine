import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { environment } from '../../core/config/env';
import { AuthApiService } from '../../data/api/auth-api.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div
      class="min-h-screen flex items-center justify-center relative overflow-hidden"
      style="background: radial-gradient(1200px 600px at 10% 10%, #a5b4fc44, transparent),
                        radial-gradient(1000px 500px at 90% 90%, #f9a8d444, transparent),
                        linear-gradient(135deg, #0f172a, #1e1b4b);"
    >
      <div class="absolute inset-0 opacity-30 pointer-events-none"
        style="background:
        radial-gradient(circle at 20px 20px, rgba(255,255,255,.12) 1px, transparent 1px) 0 0 / 30px 30px;">
      </div>
      <div class="relative w-[420px] max-w-[92vw]">
        <div class="text-center mb-6">
          <div class="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-3"
            style="background: linear-gradient(135deg, #6366f1, #ec4899);
                   box-shadow: 0 10px 30px -10px rgba(99,102,241,.6);">
            <i class="bi bi-diagram-3-fill text-white text-2xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Workflow Engine</h1>
          <p class="text-sm text-slate-300 mt-1">
            Modern process orchestration · signals & standalone components
          </p>
        </div>
        <div class="wfe-card-elevated p-6 space-y-4"
          style="background: rgba(255,255,255,.98);">
          <div>
            <label class="wfe-label">Email</label>
            <input class="wfe-input" type="email" [(ngModel)]="email" placeholder="admin@example.com" />
          </div>
          <div>
            <label class="wfe-label">Password</label>
            <input class="wfe-input" type="password" [(ngModel)]="password" placeholder="••••••••" />
          </div>
          <button class="wfe-btn wfe-btn-primary w-full" (click)="loginReal()" [disabled]="isLoading">
            <i class="bi bi-box-arrow-in-right"></i> {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  private auth = inject(AuthStore);
  private authApi = inject(AuthApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // Real State
  email = '';
  password = '';
  isLoading = false;

  loginReal() {
    if (!this.email || !this.password) {
      this.toast.error('Please enter email and password');
      return;
    }

    this.isLoading = true;
    this.authApi.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.auth.login({
          token: res.accessToken,
          user: {
            id: res.user.id,
            displayName: `${res.user.firstName} ${res.user.lastName}`,
            email: res.user.email,
            roles: [],
            active: true,
          },
          activeTenantId: 'default',
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(err.error?.message || 'Login failed');
      },
    });
  }
}
