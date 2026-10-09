import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DefinitionsApi } from '../../data/definitions.api';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'create-definition-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="wfe-page max-w-2xl mx-auto mt-10">
      <div class="wfe-page-header">
        <div>
          <a routerLink="/definitions" class="text-xs text-indigo-600 hover:underline mb-2 inline-block">
            <i class="bi bi-arrow-left"></i> Back to definitions
          </a>
          <h1 class="wfe-page-title">New Workflow Definition</h1>
          <p class="wfe-page-subtitle">Create a new version-controlled workflow state machine.</p>
        </div>
      </div>

      <div class="wfe-card p-6 space-y-5">
        <div>
          <label class="wfe-label">Workflow Name</label>
          <input class="wfe-input" [(ngModel)]="name" placeholder="e.g. Employee Onboarding" />
        </div>
        <div>
          <label class="wfe-label">Code Key</label>
          <input class="wfe-input" [(ngModel)]="code" placeholder="e.g. ONBOARDING_V1" />
          <p class="text-xs text-slate-400 mt-1">A unique, uppercase string without spaces.</p>
        </div>
        <div>
          <label class="wfe-label">Description</label>
          <textarea
            class="wfe-input"
            [(ngModel)]="description"
            placeholder="Brief description of what this workflow accomplishes..."
          ></textarea>
        </div>

        <div class="pt-4 border-t border-slate-100 flex gap-2">
          <button class="wfe-btn wfe-btn-primary flex-1" [disabled]="saving()" (click)="create()">
            @if (saving()) {
              <i class="bi bi-arrow-repeat animate-spin"></i>
            }
            Create Workflow
          </button>
          <a routerLink="/definitions" class="wfe-btn wfe-btn-ghost flex-1 justify-center">Cancel</a>
        </div>
      </div>
    </div>
  `,
})
export class CreateDefinitionPage {
  private api = inject(DefinitionsApi);
  private router = inject(Router);
  private toast = inject(ToastService);

  name = '';
  code = '';
  description = '';
  saving = signal(false);

  create() {
    if (!this.name || !this.code) {
      this.toast.error('Name and Code are required');
      return;
    }

    this.saving.set(true);
    this.api
      .create({
        name: this.name,
        code: this.code.toUpperCase().replace(/\s+/g, '_'),
        description: this.description,
      })
      .subscribe({
        next: (def) => {
          this.toast.success('Workflow definition created');
          this.router.navigate(['/designer', def.id, def.version]);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to create workflow definition');
          this.saving.set(false);
        },
        complete: () => this.saving.set(false),
      });
  }
}
