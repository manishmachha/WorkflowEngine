import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkflowInstancesApiService } from '../../../../data/api/workflow-instances-api.service';
import { WorkflowVersionsApiService } from '../../../../data/api/workflow-versions-api.service';
import { DefinitionsApi } from '../../../../data/definitions.api';
import { WorkflowInstanceDto } from '../../../../data/api/api-models';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { DefinitionsCollectionToolbarComponent } from '../../shared/definitions-collection-toolbar.component';
import { DefinitionsPaginatorComponent } from '../../shared/definitions-paginator.component';
import { DefinitionsSortHeaderComponent } from '../../shared/definitions-sort-header.component';
import {
  applyCollection,
  DefinitionsViewMode,
  SortDirection,
  toggleSort,
} from '../../shared/definitions-collection';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { StartInstancePanelComponent } from '../../start-instance-dialog.component';

@Component({
  selector: 'hub-instances-tab',
  standalone: true,
  imports: [
    RouterLink,
    RelativeTimePipe,
    DefinitionsCollectionToolbarComponent,
    DefinitionsPaginatorComponent,
    DefinitionsSortHeaderComponent,
    ModalShellComponent,
    StartInstancePanelComponent,
  ],
  template: `
    <definitions-collection-toolbar
      [search]="tableSearch()"
      [view]="viewMode()"
      (searchChange)="onSearch($event)"
      (viewChange)="viewMode.set($event)"
    >
      <button
        type="button"
        class="wfe-btn wfe-btn-primary"
        [disabled]="!publishedVersion"
        (click)="openStart()"
      >
        <i class="bi bi-play-fill"></i> Start
      </button>
    </definitions-collection-toolbar>

    @if (viewMode() === 'table') {
      <div class="wfe-card overflow-hidden">
        <table class="wfe-table">
          <thead>
            <tr>
              <th definitionsSortHeader="businessKey" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                Business key
              </th>
              <th definitionsSortHeader="status" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                Status
              </th>
              <th definitionsSortHeader="startedAt" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                Started
              </th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (i of collection().page; track i.id) {
              <tr>
                <td class="font-mono text-sm">{{ i.businessKey || '—' }}</td>
                <td>{{ i.status }}</td>
                <td class="text-sm text-slate-500">{{ i.startedAt | relTime }}</td>
                <td>
                  <div class="wfe-icon-actions">
                    <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="detail = i">
                      <i class="bi bi-info-circle"></i>
                    </button>
                    <a
                      class="wfe-btn wfe-btn-ghost wfe-btn-icon"
                      [routerLink]="['/instances', i.id]"
                      [queryParams]="{ defId: definitionId() }"
                    >
                      <i class="bi bi-box-arrow-up-right"></i>
                    </a>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="wfe-empty">No instances.</td></tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="definitions-card-grid">
        @for (i of collection().page; track i.id) {
          <div class="wfe-card p-4 space-y-2">
            <h3 class="font-semibold font-mono text-sm">{{ i.businessKey || i.id.slice(0, 8) }}</h3>
            <p class="text-sm text-slate-600">{{ i.status }}</p>
            <p class="text-xs text-slate-500">Started {{ i.startedAt | relTime }}</p>
            <div class="wfe-icon-actions justify-end">
              <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="detail = i">
                <i class="bi bi-info-circle"></i>
              </button>
              <a
                class="wfe-btn wfe-btn-ghost wfe-btn-icon"
                [routerLink]="['/instances', i.id]"
                [queryParams]="{ defId: definitionId() }"
              >
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
            </div>
          </div>
        }
      </div>
    }

    <definitions-paginator
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
      [total]="collection().total"
      (pageIndexChange)="pageIndex.set($event)"
      (pageSizeChange)="pageSize.set($event)"
    />

    @if (detail) {
      <wfe-modal-shell title="Instance" (dismiss)="detail = null">
        <dl class="grid grid-cols-2 gap-3 text-sm">
          <div><dt class="wfe-dt">Business key</dt><dd>{{ detail.businessKey || '—' }}</dd></div>
          <div><dt class="wfe-dt">Status</dt><dd>{{ detail.status }}</dd></div>
          <div><dt class="wfe-dt">Started</dt><dd>{{ detail.startedAt | relTime }}</dd></div>
          <div><dt class="wfe-dt">Waiting</dt><dd>{{ detail.waitingReason || '—' }}</dd></div>
        </dl>
      </wfe-modal-shell>
    }

    @if (startDef) {
      <wfe-modal-shell
        title="Start instance"
        [subtitle]="startDef.name + ' · v' + startDef.version"
        size="lg"
        (dismiss)="startDef = null"
      >
        <start-instance-panel
          [def]="startDef"
          (cancelled)="startDef = null"
          (started)="onStarted()"
        />
      </wfe-modal-shell>
    }
  `,
  styles: `
    .definitions-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
  `,
})
export class HubInstancesTabComponent implements OnInit {
  definitionId = input.required<string>();

  private instancesApi = inject(WorkflowInstancesApiService);
  private versionsApi = inject(WorkflowVersionsApiService);
  private definitionsApi = inject(DefinitionsApi);

  private rows = signal<WorkflowInstanceDto[]>([]);
  viewMode = signal<DefinitionsViewMode>('table');
  tableSearch = signal('');
  sortKey = signal('startedAt');
  sortDir = signal<SortDirection>('desc');
  pageIndex = signal(0);
  pageSize = signal(12);

  publishedVersion: { version: number } | null = null;
  detail: WorkflowInstanceDto | null = null;
  startDef: import('../../../../domain/definition').WorkflowDefinition | null = null;

  collection = computed(() =>
    applyCollection(this.rows(), {
      search: this.tableSearch(),
      match: (i, q) =>
        (i.businessKey || '').toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q),
      sortKey: this.sortKey(),
      sortDir: this.sortDir(),
      sortValue: (i, key) => {
        if (key === 'startedAt') return new Date(i.startedAt).getTime();
        if (key === 'status') return i.status;
        return (i.businessKey || i.id).toLowerCase();
      },
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    }),
  );

  ngOnInit() {
    this.versionsApi.findAll(this.definitionId()).subscribe((versions) => {
      const pub = versions.find((v) => v.status === 'PUBLISHED');
      this.publishedVersion = pub ? { version: pub.version } : null;
    });
    this.reload();
  }

  reload() {
    this.instancesApi.findAll(this.definitionId()).subscribe((list) => {
      this.rows.set([...list].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()));
    });
  }

  onSearch(v: string) {
    this.tableSearch.set(v);
    this.pageIndex.set(0);
  }

  setSort(key: string) {
    const next = toggleSort(this.sortKey(), this.sortDir(), key);
    this.sortKey.set(next.sortKey);
    this.sortDir.set(next.sortDir);
  }

  openStart() {
    const v = this.publishedVersion;
    if (!v) return;
    this.definitionsApi.get(this.definitionId(), v.version).subscribe((d) => {
      if (d) this.startDef = d;
    });
  }

  onStarted() {
    this.startDef = null;
    this.reload();
  }
}
