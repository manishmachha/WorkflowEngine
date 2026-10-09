import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkflowVersionsApiService } from '../../../../data/api/workflow-versions-api.service';
import { DefinitionsStore } from '../../definitions.store';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { WorkflowVersionDto } from '../../../../data/api/api-models';
import {
  applyCollection,
  DefinitionsViewMode,
  SortDirection,
  toggleSort,
} from '../../shared/definitions-collection';
import { DefinitionsCollectionToolbarComponent } from '../../shared/definitions-collection-toolbar.component';
import { DefinitionsPaginatorComponent } from '../../shared/definitions-paginator.component';
import { DefinitionsSortHeaderComponent } from '../../shared/definitions-sort-header.component';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import {
  canArchiveVersion,
  canPublishVersion,
  versionStatusLabel,
} from '../../workflow-version-lifecycle';

@Component({
  selector: 'hub-versions-tab',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    RelativeTimePipe,
    DefinitionsCollectionToolbarComponent,
    DefinitionsPaginatorComponent,
    DefinitionsSortHeaderComponent,
    ModalShellComponent,
  ],
  template: `
    <div class="flex justify-end mb-3">
      <button type="button" class="wfe-btn wfe-btn-primary" (click)="createDraft()">
        <i class="bi bi-copy"></i> New draft
      </button>
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
              <th definitionsSortHeader="version" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                Ver
              </th>
              <th definitionsSortHeader="status" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                Status
              </th>
              <th>Effective</th>
              <th definitionsSortHeader="updatedAt" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">
                Updated
              </th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (v of collection().page; track v.id) {
              <tr>
                <td>v{{ v.version }}</td>
                <td>{{ versionStatusLabel(v.status) }}</td>
                <td class="text-sm text-slate-500">
                  {{ v.startingDate || '—' }} → {{ v.expiryDate || '—' }}
                </td>
                <td class="text-sm text-slate-500">{{ v.updatedAt | relTime }}</td>
                <td>
                  <div class="wfe-icon-actions">
                    <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" title="Details" (click)="openDetail(v)">
                      <i class="bi bi-info-circle"></i>
                    </button>
                    <a
                      class="wfe-btn wfe-btn-ghost wfe-btn-icon"
                      title="Designer"
                      [routerLink]="['/designer', definitionId(), v.version]"
                    >
                      <i class="bi bi-pencil-square"></i>
                    </a>
                    @if (canPublishVersion(v.status)) {
                      <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" title="Publish" (click)="publish(v)">
                        <i class="bi bi-cloud-upload"></i>
                      </button>
                    } @else if (canArchiveVersion(v.status)) {
                      <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" title="Archive" (click)="archive(v)">
                        <i class="bi bi-archive"></i>
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="wfe-empty">No versions.</td></tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="definitions-card-grid">
        @for (v of collection().page; track v.id) {
          <div class="wfe-card p-4 space-y-2">
            <div class="flex justify-between items-start">
              <span class="font-bold">v{{ v.version }}</span>
              <span class="wfe-chip wfe-chip-neutral">{{ versionStatusLabel(v.status) }}</span>
            </div>
            <p class="text-xs text-slate-500">Updated {{ v.updatedAt | relTime }}</p>
            <div class="wfe-icon-actions justify-end pt-2 border-t border-slate-100">
              <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="openDetail(v)">
                <i class="bi bi-info-circle"></i>
              </button>
              <a class="wfe-btn wfe-btn-ghost wfe-btn-icon" [routerLink]="['/designer', definitionId(), v.version]">
                <i class="bi bi-pencil-square"></i>
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
      [pageSizeOptions]="[5, 10, 20]"
      (pageIndexChange)="pageIndex.set($event)"
      (pageSizeChange)="pageSize.set($event)"
    />

    @if (detailVersion) {
      <wfe-modal-shell title="Version details" [showFooter]="true" (dismiss)="detailVersion = null">
        <p class="text-sm text-slate-600 mb-4">v{{ detailVersion.version }} · {{ versionStatusLabel(detailVersion.status) }}</p>
        <div class="space-y-3">
          <div>
            <label class="wfe-label">Starting date</label>
            <input type="datetime-local" class="wfe-input" [(ngModel)]="detailStarting" />
          </div>
          <div>
            <label class="wfe-label">Expiry date</label>
            <input type="datetime-local" class="wfe-input" [(ngModel)]="detailExpiry" />
          </div>
        </div>
        <div modalActions>
          <button type="button" class="wfe-btn wfe-btn-primary" (click)="saveVersionDates()">Save</button>
          <button type="button" class="wfe-btn wfe-btn-ghost" (click)="detailVersion = null">Cancel</button>
        </div>
      </wfe-modal-shell>
    }
  `,
  styles: `
    .definitions-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }
  `,
})
export class HubVersionsTabComponent implements OnInit {
  definitionId = input.required<string>();

  private versionsApi = inject(WorkflowVersionsApiService);
  private store = inject(DefinitionsStore);
  private toast = inject(ToastService);

  private rows = signal<WorkflowVersionDto[]>([]);
  viewMode = signal<DefinitionsViewMode>('table');
  tableSearch = signal('');
  sortKey = signal('version');
  sortDir = signal<SortDirection>('desc');
  pageIndex = signal(0);
  pageSize = signal(10);

  detailVersion: WorkflowVersionDto | null = null;
  detailStarting = '';
  detailExpiry = '';

  readonly canPublishVersion = canPublishVersion;
  readonly canArchiveVersion = canArchiveVersion;
  readonly versionStatusLabel = versionStatusLabel;

  collection = computed(() =>
    applyCollection(this.rows(), {
      search: this.tableSearch(),
      match: (v, q) =>
        String(v.version).includes(q) ||
        versionStatusLabel(v.status).toLowerCase().includes(q),
      sortKey: this.sortKey(),
      sortDir: this.sortDir(),
      sortValue: (v, key) => {
        if (key === 'updatedAt') return new Date(v.updatedAt).getTime();
        if (key === 'status') return v.status;
        return v.version;
      },
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    }),
  );

  ngOnInit() {
    this.reload();
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

  reload() {
    this.versionsApi.findAll(this.definitionId()).subscribe((versions) => {
      this.rows.set([...versions].sort((a, b) => b.version - a.version));
    });
  }

  createDraft() {
    const source = this.rows()[0];
    if (!source) {
      this.toast.error('No version to copy from');
      return;
    }
    this.store.createDraft(this.definitionId(), source.id);
    setTimeout(() => this.reload(), 700);
  }

  publish(v: WorkflowVersionDto) {
    this.store.publish(this.definitionId(), v.version, v.status);
    setTimeout(() => this.reload(), 400);
  }

  archive(v: WorkflowVersionDto) {
    if (!confirm('Archive this published version?')) return;
    this.store.archive(this.definitionId(), v.version, v.status);
    setTimeout(() => this.reload(), 400);
  }

  openDetail(v: WorkflowVersionDto) {
    this.versionsApi.findOne(this.definitionId(), v.id).subscribe({
      next: (full) => {
        this.detailVersion = full;
        this.detailStarting = full.startingDate?.slice(0, 16) || '';
        this.detailExpiry = full.expiryDate?.slice(0, 16) || '';
      },
      error: () => this.toast.error('Failed to load version'),
    });
  }

  saveVersionDates() {
    const full = this.detailVersion;
    if (!full) return;
    this.versionsApi
      .update(this.definitionId(), full.id, {
        startingDate: this.detailStarting || undefined,
        expiryDate: this.detailExpiry || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Version updated');
          this.detailVersion = null;
          this.reload();
        },
        error: () => this.toast.error('Version update failed'),
      });
  }
}
