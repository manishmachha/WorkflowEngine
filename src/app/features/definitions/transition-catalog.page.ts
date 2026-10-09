import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActionsApi } from '../../data/actions.api';
import { DefinitionsCollectionToolbarComponent } from './shared/definitions-collection-toolbar.component';
import { DefinitionsPaginatorComponent } from './shared/definitions-paginator.component';
import { DefinitionsSortHeaderComponent } from './shared/definitions-sort-header.component';
import {
  applyCollection,
  DefinitionsViewMode,
  SortDirection,
  sortField,
  toggleSort,
} from './shared/definitions-collection';

interface TransitionCatalogRow {
  actionKey: string;
  workflow: string;
  from: string;
  to: string;
  roles: string[];
  auto: boolean;
}

@Component({
  selector: 'transition-catalog-page',
  standalone: true,
  imports: [
    RouterLink,
    DefinitionsCollectionToolbarComponent,
    DefinitionsPaginatorComponent,
    DefinitionsSortHeaderComponent,
  ],
  template: `
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <h1 class="wfe-page-title">Transition catalog</h1>
          <p class="wfe-page-subtitle">Transition keys from published workflow definitions.</p>
        </div>
        <a class="wfe-btn wfe-btn-outline" routerLink="/definitions/action-library">
          <i class="bi bi-lightning-charge"></i> Actions
        </a>
      </div>

      <definitions-collection-toolbar
        [search]="tableSearch()"
        [view]="viewMode()"
        (searchChange)="onSearch($event)"
        (viewChange)="viewMode.set($event)"
      />

      @if (viewMode() === 'table') {
        <div class="wfe-card overflow-hidden">
          <table class="wfe-table">
            <thead>
              <tr>
                <th definitionsSortHeader="actionKey" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                  Action key
                </th>
                <th definitionsSortHeader="workflow" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                  Workflow
                </th>
                <th>From → To</th>
                <th>Roles</th>
                <th definitionsSortHeader="auto" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                  Mode
                </th>
              </tr>
            </thead>
            <tbody>
              @for (a of collection().page; track a.workflow + a.actionKey) {
                <tr>
                  <td class="font-mono text-xs">{{ a.actionKey }}</td>
                  <td>{{ a.workflow }}</td>
                  <td>{{ a.from }} → {{ a.to }}</td>
                  <td>{{ a.roles.join(', ') || 'any' }}</td>
                  <td>{{ a.auto ? 'auto' : 'user' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="wfe-empty">No transitions in catalog.</td></tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="definitions-card-grid">
          @for (a of collection().page; track a.workflow + a.actionKey) {
            <div class="wfe-card p-4 text-sm space-y-1">
              <div class="font-mono font-semibold">{{ a.actionKey }}</div>
              <div class="text-slate-600">{{ a.workflow }}</div>
              <p>{{ a.from }} → {{ a.to }}</p>
              <p class="text-xs text-slate-500">{{ a.auto ? 'auto' : 'user' }} · {{ a.roles.join(', ') || 'any role' }}</p>
            </div>
          }
        </div>
      }

      <definitions-paginator
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [total]="collection().total"
        [pageSizeOptions]="[8, 16, 32]"
        (pageIndexChange)="pageIndex.set($event)"
        (pageSizeChange)="pageSize.set($event)"
      />
    </div>
  `,
  styles: `
    .definitions-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
  `,
})
export class TransitionCatalogPage {
  private api = inject(ActionsApi);

  private catalogRows = computed<TransitionCatalogRow[]>(() =>
    this.api.catalog().map((a) => ({
      actionKey: a.actionKey,
      workflow: a.workflow,
      from: a.from,
      to: a.to,
      roles: a.roles,
      auto: a.auto,
    })),
  );

  viewMode = signal<DefinitionsViewMode>('table');
  tableSearch = signal('');
  sortKey = signal('actionKey');
  sortDir = signal<SortDirection>('asc');
  pageIndex = signal(0);
  pageSize = signal(16);

  collection = computed(() =>
    applyCollection(this.catalogRows(), {
      search: this.tableSearch(),
      match: (row, q) => JSON.stringify(row).toLowerCase().includes(q),
      sortKey: this.sortKey(),
      sortDir: this.sortDir(),
      sortValue: (row, key) => {
        if (key === 'auto') return row.auto ? 1 : 0;
        return sortField(row, key);
      },
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    }),
  );

  onSearch(value: string) {
    this.tableSearch.set(value);
    this.pageIndex.set(0);
  }

  setSort(key: string) {
    const next = toggleSort(this.sortKey(), this.sortDir(), key);
    this.sortKey.set(next.sortKey);
    this.sortDir.set(next.sortDir);
  }
}
