import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActionDefinitionsApiService } from '../../../data/api/action-definitions-api.service';
import { ActionDefinitionDto, ActionDefinitionType } from '../../../data/api/api-models';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { DefinitionsCollectionToolbarComponent } from '../../definitions/shared/definitions-collection-toolbar.component';
import { DefinitionsPaginatorComponent } from '../../definitions/shared/definitions-paginator.component';
import { DefinitionsSortHeaderComponent } from '../../definitions/shared/definitions-sort-header.component';
import {
  applyCollection,
  DefinitionsViewMode,
  SortDirection,
  sortField,
  toggleSort,
} from '../../definitions/shared/definitions-collection';
import { ModalShellComponent } from '../../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'action-definitions-panel',
  standalone: true,
  imports: [
    FormsModule,
    DefinitionsCollectionToolbarComponent,
    DefinitionsPaginatorComponent,
    DefinitionsSortHeaderComponent,
    ModalShellComponent,
  ],
  template: `
    <div class="wfe-page-header">
      <div>
        <h1 class="wfe-page-title">Action library</h1>
        <p class="wfe-page-subtitle">Reusable action definitions for workflow nodes and transitions.</p>
      </div>
    </div>

    <definitions-collection-toolbar
      [search]="tableSearch()"
      [view]="viewMode()"
      (searchChange)="onSearch($event)"
      (viewChange)="viewMode.set($event)"
    >
      <label class="wfe-label-inline">
        Filter
        <select class="wfe-select wfe-select-sm" [(ngModel)]="listMode" (ngModelChange)="load()">
          <option value="all">All</option>
          <option value="active">Active</option>
        </select>
      </label>
      <button type="button" class="wfe-btn wfe-btn-primary" title="New action" (click)="openCreateForm()">
        <i class="bi bi-plus-lg"></i>
      </button>
    </definitions-collection-toolbar>

    @if (viewMode() === 'table') {
      <div class="wfe-card overflow-hidden">
        <table class="wfe-table">
          <thead>
            <tr>
              <th definitionsSortHeader="code" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Code</th>
              <th definitionsSortHeader="name" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Name</th>
              <th definitionsSortHeader="type" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Type</th>
              <th definitionsSortHeader="handlerKey" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Handler</th>
              <th definitionsSortHeader="active" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Active</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (a of collection().page; track a.id) {
              <tr>
                <td class="font-mono text-xs">{{ a.code }}</td>
                <td>{{ a.name }}</td>
                <td>{{ a.type }}</td>
                <td class="font-mono text-xs">{{ a.handlerKey }}</td>
                <td>{{ a.active ? 'Yes' : 'No' }}</td>
                <td>
                  <div class="wfe-icon-actions">
                    <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="lookupByCode(a.code)">
                      <i class="bi bi-search"></i>
                    </button>
                    <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="toggleActive(a)">
                      <i class="bi" [class.bi-toggle-on]="a.active" [class.bi-toggle-off]="!a.active"></i>
                    </button>
                    <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="editAction(a.id)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="deleteAction(a)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="wfe-empty">No actions.</td></tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="definitions-card-grid">
        @for (a of collection().page; track a.id) {
          <div class="wfe-card p-4 text-sm space-y-2">
            <div class="font-semibold">{{ a.name }}</div>
            <div class="font-mono text-xs text-slate-500">{{ a.code }}</div>
            <p class="text-slate-600">{{ a.type }} · {{ a.active ? 'Active' : 'Inactive' }}</p>
            <div class="wfe-icon-actions justify-end">
              <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="editAction(a.id)">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="deleteAction(a)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
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

    @if (lookupDto) {
      <wfe-modal-shell [title]="lookupDto.code" (dismiss)="lookupDto = null">
        <dl class="space-y-2 text-sm">
          <div><dt class="wfe-dt">Name</dt><dd>{{ lookupDto.name }}</dd></div>
          <div><dt class="wfe-dt">Handler</dt><dd class="font-mono">{{ lookupDto.handlerKey }}</dd></div>
          <div><dt class="wfe-dt">Description</dt><dd>{{ lookupDto.description || '—' }}</dd></div>
        </dl>
      </wfe-modal-shell>
    }

    @if (formModal) {
      <wfe-modal-shell [title]="formModal.title" [showFooter]="true" (dismiss)="formModal = null">
        <div class="space-y-3">
          <div><label class="wfe-label">Name</label><input class="wfe-input" [(ngModel)]="formModal.model.name" /></div>
          <div><label class="wfe-label">Code</label><input class="wfe-input" [(ngModel)]="formModal.model.code" /></div>
          <div>
            <label class="wfe-label">Type</label>
            <select class="wfe-select" [(ngModel)]="formModal.model.type">
              <option value="SYSTEM">System</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div><label class="wfe-label">Handler key</label><input class="wfe-input" [(ngModel)]="formModal.model.handlerKey" /></div>
          <div><label class="wfe-label">Description</label><textarea class="wfe-input" rows="3" [(ngModel)]="formModal.model.description"></textarea></div>
        </div>
        <div modalActions>
          <button type="button" class="wfe-btn wfe-btn-primary" (click)="saveForm()">Save</button>
          <button type="button" class="wfe-btn wfe-btn-ghost" (click)="formModal = null">Cancel</button>
        </div>
      </wfe-modal-shell>
    }
  `,
  styles: `
    .definitions-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
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
export class ActionDefinitionsPanelComponent implements OnInit {
  embedded = input(false);

  private actionsApi = inject(ActionDefinitionsApiService);
  private toast = inject(ToastService);

  rawActions = signal<ActionDefinitionDto[]>([]);
  viewMode = signal<DefinitionsViewMode>('table');
  tableSearch = signal('');
  sortKey = signal('code');
  sortDir = signal<SortDirection>('asc');
  pageIndex = signal(0);
  pageSize = signal(16);
  listMode: 'all' | 'active' = 'all';

  lookupDto: ActionDefinitionDto | null = null;
  formModal: {
    title: string;
    editingId?: string;
    model: {
      name: string;
      code: string;
      description: string;
      type: ActionDefinitionType;
      handlerKey: string;
    };
  } | null = null;

  collection = computed(() =>
    applyCollection(this.rawActions(), {
      search: this.tableSearch(),
      match: (row, q) => JSON.stringify(row).toLowerCase().includes(q),
      sortKey: this.sortKey(),
      sortDir: this.sortDir(),
      sortValue: (row, key) => {
        if (key === 'active') return row.active ? 1 : 0;
        return sortField(row, key);
      },
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    }),
  );

  ngOnInit() {
    this.load();
  }

  onSearch(value: string) {
    this.tableSearch.set(value);
    this.pageIndex.set(0);
  }

  setSort(key: string) {
    const next = toggleSort(this.sortKey(), this.sortDir(), key);
    this.sortKey.set(next.sortKey);
    this.sortDir.set(next.sortDir);
  }

  load() {
    const req = this.listMode === 'active' ? this.actionsApi.findActive() : this.actionsApi.findAll();
    req.subscribe((actions) => this.rawActions.set(actions));
  }

  lookupByCode(code: string) {
    this.actionsApi.findByCode(code).subscribe({
      next: (a) => (this.lookupDto = a),
      error: () => this.toast.error('Action not found for code'),
    });
  }

  openCreateForm() {
    this.formModal = {
      title: 'New action definition',
      model: { name: '', code: '', description: '', type: 'SYSTEM', handlerKey: '' },
    };
  }

  editAction(id: string) {
    this.actionsApi.findOne(id).subscribe({
      next: (action) => {
        this.formModal = {
          title: 'Edit action definition',
          editingId: id,
          model: {
            name: action.name,
            code: action.code,
            description: action.description || '',
            type: action.type,
            handlerKey: action.handlerKey,
          },
        };
      },
      error: () => this.toast.error('Failed to load action definition'),
    });
  }

  saveForm() {
    const fm = this.formModal;
    if (!fm) return;
    this.persistAction(fm.model, fm.editingId);
  }

  private persistAction(
    model: {
      name: string;
      code: string;
      description: string;
      type: ActionDefinitionType;
      handlerKey: string;
    },
    editingId?: string,
  ) {
    if (!model.name || !model.code || !model.handlerKey) {
      this.toast.error('Name, code, and handler key are required');
      return;
    }
    if (editingId) {
      this.actionsApi.update(editingId, model).subscribe({
        next: () => {
          this.toast.success('Action definition updated');
          this.formModal = null;
          this.load();
        },
        error: (err: { error?: { message?: string } }) =>
          this.toast.error(err.error?.message || 'Failed to update'),
      });
      return;
    }
    this.actionsApi.findByCode(model.code).subscribe({
      next: () => this.toast.error(`Code ${model.code} already exists`),
      error: (err: { status?: number }) => {
        if (err.status === 404) {
          this.actionsApi.create({ ...model, active: true }).subscribe({
            next: () => {
              this.toast.success('Action definition created');
              this.formModal = null;
              this.load();
            },
            error: (e: { error?: { message?: string } }) =>
              this.toast.error(e.error?.message || 'Failed to create'),
          });
        } else {
          this.toast.error('Error validating action code');
        }
      },
    });
  }

  toggleActive(action: ActionDefinitionDto) {
    this.actionsApi.update(action.id, { active: !action.active }).subscribe({
      next: () => {
        this.toast.success('Action definition updated');
        this.load();
      },
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message || 'Failed to update'),
    });
  }

  deleteAction(action: ActionDefinitionDto) {
    if (!confirm(`Delete action definition "${action.name}"?`)) return;
    this.actionsApi.remove(action.id).subscribe({
      next: () => {
        this.toast.success('Action definition deleted');
        this.load();
      },
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message || 'Failed to delete'),
    });
  }
}
