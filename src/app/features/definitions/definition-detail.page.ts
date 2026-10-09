import { Component, inject, input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DefinitionsApi } from '../../data/definitions.api';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { DefinitionHubTabsComponent } from './hub/definition-hub-tabs.component';

@Component({
  selector: 'definition-detail-page',
  standalone: true,
  imports: [RouterLink, DefinitionHubTabsComponent],
  template: `
    <div class="wfe-page">
      <a routerLink="/definitions" class="text-xs text-indigo-600 mb-2 inline-block">
        <i class="bi bi-arrow-left"></i> Back to definitions
      </a>
      <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
        <div>
          <h1 class="wfe-page-title mb-2">{{ title }}</h1>
          <p class="text-sm text-slate-700 font-mono">{{ id() }}</p>
        </div>
        <button
          type="button"
          class="wfe-btn wfe-btn-outline wfe-btn-danger"
          title="Delete workflow"
          (click)="deleteDef()"
        >
          <i class="bi bi-trash"></i>
          <span class="hidden sm:inline">Delete</span>
        </button>
      </div>
      <definition-hub-tabs [definitionId]="id()" />
    </div>
  `,
})
export class DefinitionDetailPage implements OnInit {
  id = input.required<string>();
  title = 'Workflow';

  private api = inject(DefinitionsApi);
  private router = inject(Router);
  private toast = inject(ToastService);

  ngOnInit() {
    this.api.versions(this.id()).subscribe((v) => {
      if (v[0]) this.title = v[0].name;
    });
  }

  deleteDef() {
    if (
      !confirm('Permanently delete this workflow definition and all versions?')
    ) {
      return;
    }
    this.api.delete(this.id()).subscribe({
      next: () => {
        this.toast.success('Workflow definition deleted');
        this.router.navigate(['/definitions']);
      },
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message || 'Failed to delete definition'),
    });
  }
}
