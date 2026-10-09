import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DefinitionsStore } from './definitions.store';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { WorkflowDefinition } from '../../domain/definition';
import { WorkflowDefinitionsApiService } from '../../data/api/workflow-definitions-api.service';
import { WorkflowDefinitionDto } from '../../data/api/api-models';
import { StartInstancePanelComponent } from './start-instance-dialog.component';
import { DefinitionsCollectionToolbarComponent } from './shared/definitions-collection-toolbar.component';
import { DefinitionsPaginatorComponent } from './shared/definitions-paginator.component';
import { DefinitionsSortHeaderComponent } from './shared/definitions-sort-header.component';
import {
  applyCollection,
  DefinitionsViewMode,
  SortDirection,
  toggleSort,
} from './shared/definitions-collection';
import { ModalShellComponent } from '../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'definitions-list-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    RelativeTimePipe,
    DefinitionsCollectionToolbarComponent,
    DefinitionsPaginatorComponent,
    DefinitionsSortHeaderComponent,
    ModalShellComponent,
    StartInstancePanelComponent,
  ],
  template: `
    <div class="wfe-page">
      <div class="wfe-page-header">
        <div>
          <h1 class="wfe-page-title">Workflow definitions</h1>
          <p class="wfe-page-subtitle">Search, sort, and open the workflow hub for each definition.</p>
        </div>
        <a class="wfe-btn wfe-btn-primary" routerLink="/definitions/new">
          <i class="bi bi-plus-lg"></i> New workflow
        </a>
      </div>

      <definitions-collection-toolbar
        [search]="tableSearch()"
        [view]="viewMode()"
        (searchChange)="onSearch($event)"
        (viewChange)="viewMode.set($event)"
      >
        <label class="wfe-label-inline">
          Scope
          <select class="wfe-select wfe-select-sm" [(ngModel)]="listScope" (ngModelChange)="reloadList()">
            <option value="organization">My organization</option>
            <option value="all">All definitions</option>
          </select>
        </label>
      </definitions-collection-toolbar>

      @if (viewMode() === 'table') {
        <div class="wfe-card overflow-hidden">
          <table class="wfe-table">
            <thead>
              <tr>
                <th definitionsSortHeader="name" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                  Name
                </th>
                <th definitionsSortHeader="status" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                  Status
                </th>
                <th definitionsSortHeader="version" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                  Ver
                </th>
                <th definitionsSortHeader="updatedAt" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                  Updated
                </th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (d of collection().page; track d.id) {
                <tr>
                  <td>
                    <div class="font-semibold text-slate-900">{{ d.name }}</div>
                    <div class="text-xs font-mono text-slate-500">{{ d.code }}</div>
                  </td>
                  <td>{{ d.status }}</td>
                  <td>v{{ d.version }}</td>
                  <td class="text-sm text-slate-500">{{ d.updatedAt | relTime }}</td>
                  <td>
                    <div class="wfe-icon-actions">
                      <button
                        type="button"
                        class="wfe-btn wfe-btn-ghost wfe-btn-icon"
                        title="Start"
                        [disabled]="d.status !== 'published'"
                        (click)="openStart(d)"
                      >
                        <i class="bi bi-play-fill"></i>
                      </button>
                      <a
                        class="wfe-btn wfe-btn-ghost wfe-btn-icon"
                        title="Designer"
                        [routerLink]="['/designer', d.id, d.version]"
                      >
                        <i class="bi bi-pencil-square"></i>
                      </a>
                      <a class="wfe-btn wfe-btn-ghost wfe-btn-icon" title="Hub" [routerLink]="['/definitions', d.id]">
                        <i class="bi bi-grid-1x2"></i>
                      </a>
                      <button
                        type="button"
                        class="wfe-btn wfe-btn-ghost wfe-btn-icon"
                        title="Details"
                        (click)="openDefDetails(d.id)"
                      >
                        <i class="bi bi-info-circle"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="wfe-empty !py-10">No definitions match.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="definitions-card-grid">
          @for (d of collection().page; track d.id) {
            <div class="wfe-card p-4 flex flex-col gap-3">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <i class="bi bi-diagram-3-fill"></i>
                </div>
                <div class="min-w-0">
                  <h3 class="font-semibold text-slate-900 truncate">{{ d.name }}</h3>
                  <p class="text-xs font-mono text-slate-500">{{ d.code }}</p>
                </div>
              </div>
              <p class="text-sm text-slate-600 line-clamp-2">{{ d.description || 'No description' }}</p>
              <div class="flex justify-between text-xs text-slate-500">
                <span>{{ d.status }} · v{{ d.version }}</span>
                <span>{{ d.updatedAt | relTime }}</span>
              </div>
              <div class="wfe-icon-actions justify-end pt-1 border-t border-slate-100">
                <button
                  type="button"
                  class="wfe-btn wfe-btn-ghost wfe-btn-icon"
                  [disabled]="d.status !== 'published'"
                  (click)="openStart(d)"
                >
                  <i class="bi bi-play-fill"></i>
                </button>
                <a class="wfe-btn wfe-btn-ghost wfe-btn-icon" [routerLink]="['/designer', d.id, d.version]">
                  <i class="bi bi-pencil-square"></i>
                </a>
                <a class="wfe-btn wfe-btn-ghost wfe-btn-icon" [routerLink]="['/definitions', d.id]">
                  <i class="bi bi-grid-1x2"></i>
                </a>
              </div>
            </div>
          } @empty {
            <div class="wfe-card p-8 wfe-empty col-span-full">No definitions match your search.</div>
          }
        </div>
      }

      <definitions-paginator
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [total]="collection().total"
        [pageSizeOptions]="[6, 12, 24]"
        (pageIndexChange)="pageIndex.set($event)"
        (pageSizeChange)="pageSize.set($event)"
      />
    </div>

    @if (startDef(); as def) {
      <wfe-modal-shell
        [title]="'Start instance'"
        [subtitle]="def.name + ' · v' + def.version"
        size="lg"
        (dismiss)="startDef.set(null)"
      >
        <start-instance-panel [def]="def" (cancelled)="startDef.set(null)" (started)="startDef.set(null)" />
      </wfe-modal-shell>
    }

    @if (detailDto(); as dto) {
      <wfe-modal-shell title="Definition details" size="md" [showFooter]="true" (dismiss)="detailDto.set(null)">
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt class="wfe-dt">Name</dt>
            <dd class="wfe-dd">{{ dto.name }}</dd>
          </div>
          <div>
            <dt class="wfe-dt">Workflow key</dt>
            <dd class="wfe-dd font-mono text-sm">{{ dto.workflowKey }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="wfe-dt">Description</dt>
            <dd class="wfe-dd">{{ dto.description || '—' }}</dd>
          </div>
          <div>
            <dt class="wfe-dt">Active</dt>
            <dd class="wfe-dd">{{ dto.active ? 'Yes' : 'No' }}</dd>
          </div>
          <div>
            <dt class="wfe-dt">Updated</dt>
            <dd class="wfe-dd">{{ dto.updatedAt | relTime }}</dd>
          </div>
        </dl>
        <div modalActions>
          <a class="wfe-btn wfe-btn-primary" [routerLink]="['/definitions', dto.id]" (click)="detailDto.set(null)">
            Open hub
          </a>
          <button type="button" class="wfe-btn wfe-btn-ghost" (click)="detailDto.set(null)">Close</button>
        </div>
      </wfe-modal-shell>
    }
  `,
  styles: `
    .definitions-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .wfe-label-inline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
    }
  `,
})
export class DefinitionsListPage implements OnInit {
  store = inject(DefinitionsStore);
  private defsApi = inject(WorkflowDefinitionsApiService);

  viewMode = signal<DefinitionsViewMode>('cards');
  tableSearch = signal('');
  sortKey = signal('name');
  sortDir = signal<SortDirection>('asc');
  pageIndex = signal(0);
  pageSize = signal(12);
  listScope: 'organization' | 'all' = 'organization';

  startDef = signal<WorkflowDefinition | null>(null);
  detailDto = signal<WorkflowDefinitionDto | null>(null);

  private rows = computed(() => this.store.filtered());

  collection = computed(() =>
    applyCollection(this.rows(), {
      search: this.tableSearch(),
      match: (d, q) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q),
      sortKey: this.sortKey(),
      sortDir: this.sortDir(),
      sortValue: (d, key) => {
        switch (key) {
          case 'version':
            return d.version;
          case 'updatedAt':
            return new Date(d.updatedAt).getTime();
          case 'status':
            return d.status;
          default:
            return d.name.toLowerCase();
        }
      },
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    }),
  );

  ngOnInit() {
    this.reloadList();
  }

  onSearch(value: string) {
    this.tableSearch.set(value);
    this.store.setSearch(value);
    this.pageIndex.set(0);
  }

  setSort(key: string) {
    const next = toggleSort(this.sortKey(), this.sortDir(), key);
    this.sortKey.set(next.sortKey);
    this.sortDir.set(next.sortDir);
  }

  reloadList() {
    if (this.listScope === 'all') {
      this.defsApi.findAll().subscribe((defs) => this.store.setFromBackend(defs));
    } else {
      this.store.load();
    }
  }

  openStart(d: WorkflowDefinition) {
    this.startDef.set(d);
  }

  openDefDetails(id: string) {
    this.defsApi.findOne(id).subscribe({
      next: (d) => this.detailDto.set(d),
    });
  }
}
