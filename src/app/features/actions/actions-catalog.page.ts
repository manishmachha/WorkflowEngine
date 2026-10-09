import { Component, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActionsApi } from '../../data/actions.api';

@Component({
  selector: 'actions-catalog-page',
  standalone: true,
  imports: [NgClass, RouterLink],
  template: `
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <h1 class="wfe-page-title">Actions Catalog</h1>
          <p class="wfe-page-subtitle">
            Every action key across every published workflow. Actions are the surface the frontend
            or another system calls to advance an instance — optionally with an Amigo form payload.
          </p>
        </div>
        <a routerLink="/definitions" class="wfe-btn wfe-btn-soft">
          <i class="bi bi-diagram-3"></i> Definitions
        </a>
      </div>

      <div class="wfe-card overflow-hidden">
        <table class="wfe-table">
          <thead>
            <tr>
              <th>Action key</th>
              <th>Workflow</th>
              <th>From → To</th>
              <th>Allowed roles</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            @for (a of rows(); track a.workflow + a.actionKey) {
              <tr>
                <td>
                  <code class="font-mono text-xs font-semibold text-indigo-700">
                    {{ a.actionKey }}
                  </code>
                </td>
                <td class="text-sm text-slate-700">{{ a.workflow }}</td>
                <td class="text-xs text-slate-600">
                  <b>{{ a.from }}</b>
                  <i class="bi bi-arrow-right mx-1 text-slate-300"></i>
                  {{ a.to }}
                </td>
                <td>
                  @for (r of a.roles; track r) {
                    <span class="wfe-chip wfe-chip-neutral mr-1">{{ r }}</span>
                  } @empty {
                    <span class="text-slate-400 text-xs">any</span>
                  }
                </td>
                <td>
                  <span
                    class="wfe-chip"
                    [ngClass]="a.auto ? 'wfe-chip-info' : 'wfe-chip-success'"
                  >
                    {{ a.auto ? 'auto' : 'user-invoked' }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="wfe-empty !py-10">
                  <i class="bi bi-lightning-charge"></i>
                  No actions defined. Add an actionKey to any transition in the Designer.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ActionsCatalogPage {
  private api = inject(ActionsApi);
  rows = computed(() => this.api.catalog());
}
