import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { WorkflowVersionsApiService } from '../../../../data/api/workflow-versions-api.service';
import { WorkflowNodesApiService } from '../../../../data/api/workflow-nodes-api.service';
import { WorkflowTransitionsApiService } from '../../../../data/api/workflow-transitions-api.service';
import { WorkflowActionsApiService } from '../../../../data/api/workflow-actions-api.service';
import { ActionDefinitionsApiService } from '../../../../data/api/action-definitions-api.service';
import {
  ActionDefinitionDto,
  WorkflowActionDto,
  WorkflowVersionDto,
} from '../../../../data/api/api-models';
import { DefinitionsCollectionToolbarComponent } from '../../shared/definitions-collection-toolbar.component';
import { DefinitionsPaginatorComponent } from '../../shared/definitions-paginator.component';
import { DefinitionsSortHeaderComponent } from '../../shared/definitions-sort-header.component';
import {
  applyCollection,
  DefinitionsViewMode,
  SortDirection,
  sortField,
  toggleSort,
} from '../../shared/definitions-collection';
import { versionStatusLabel } from '../../workflow-version-lifecycle';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { WorkflowActionEditPanelComponent } from '../workflow-action-edit-dialog.component';

interface BoundActionRow {
  id: string;
  target: string;
  targetKey: string;
  event: string;
  sequence: number;
  active: boolean;
  actionDefinitionId: string;
  actionCode: string;
}

@Component({
  selector: 'hub-actions-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DefinitionsCollectionToolbarComponent,
    DefinitionsPaginatorComponent,
    DefinitionsSortHeaderComponent,
    ModalShellComponent,
    WorkflowActionEditPanelComponent,
  ],
  template: `
    <div class="hub-actions-toolbar-row">
      <div class="hub-actions-version">
        <label class="wfe-label">Version</label>
        <select class="wfe-select" [ngModel]="selectedVersionId()" (ngModelChange)="onVersionChange($event)">
          @for (v of versions(); track v.id) {
            <option [value]="v.id">v{{ v.version }} · {{ versionStatusLabel(v.status) }}</option>
          }
        </select>
      </div>
      <definitions-collection-toolbar
        [compact]="true"
        [search]="tableSearch()"
        [view]="viewMode()"
        (searchChange)="onSearch($event)"
        (viewChange)="viewMode.set($event)"
      />
    </div>

    @if (viewMode() === 'table') {
      <div class="wfe-card overflow-hidden wfe-card-accent">
        <table class="wfe-table">
          <thead>
            <tr>
              <th definitionsSortHeader="target" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Target</th>
              <th definitionsSortHeader="targetKey" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Key</th>
              <th definitionsSortHeader="actionCode" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Action</th>
              <th definitionsSortHeader="event" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Event</th>
              <th definitionsSortHeader="sequence" [activeKey]="sortKey()" [direction]="sortDir()" (sort)="setSort($event)">Seq</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (a of collection().page; track a.id) {
              <tr>
                <td>{{ a.target }}</td>
                <td class="font-mono text-xs">{{ a.targetKey }}</td>
                <td>{{ a.actionCode }}</td>
                <td>{{ a.event }}</td>
                <td>{{ a.sequence }}</td>
                <td>
                  <div class="wfe-icon-actions">
                    <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="lookupDef(a.actionDefinitionId)">
                      <i class="bi bi-book"></i>
                    </button>
                    <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="editId.set(a.id)">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="wfe-empty">No bound actions.</td></tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="definitions-card-grid">
        @for (a of collection().page; track a.id) {
          <div class="wfe-card p-4 text-sm space-y-1 wfe-card-hover wfe-card-accent">
            <div class="font-semibold">{{ a.actionCode }}</div>
            <div class="text-slate-600">{{ a.target }} · {{ a.targetKey }}</div>
            <div class="text-xs text-slate-500">{{ a.event }} · seq {{ a.sequence }}</div>
            <div class="wfe-icon-actions justify-end pt-2">
              <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="editId.set(a.id)">
                <i class="bi bi-pencil"></i>
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
      (pageIndexChange)="pageIndex.set($event)"
      (pageSizeChange)="pageSize.set($event)"
    />

    @if (lookupDto(); as dto) {
      <wfe-modal-shell [title]="dto.code" (dismiss)="lookupDto.set(null)">
        <dl class="space-y-2 text-sm">
          <div><dt class="wfe-dt">Name</dt><dd>{{ dto.name }}</dd></div>
          <div><dt class="wfe-dt">Handler</dt><dd class="font-mono">{{ dto.handlerKey }}</dd></div>
          <div><dt class="wfe-dt">Description</dt><dd>{{ dto.description || '—' }}</dd></div>
        </dl>
      </wfe-modal-shell>
    }

    @if (editId(); as id) {
      <wfe-modal-shell title="Workflow action" size="md" (dismiss)="editId.set(null)">
        <workflow-action-edit-panel
          [actionId]="id"
          (saved)="onEdited()"
          (cancelled)="editId.set(null)"
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
export class HubActionsTabComponent implements OnInit {
  definitionId = input.required<string>();

  private versionsApi = inject(WorkflowVersionsApiService);
  private nodesApi = inject(WorkflowNodesApiService);
  private transitionsApi = inject(WorkflowTransitionsApiService);
  private actionsApi = inject(WorkflowActionsApiService);
  private actionDefsApi = inject(ActionDefinitionsApiService);

  versions = signal<WorkflowVersionDto[]>([]);
  selectedVersionId = signal('');
  actionDefs = signal<ActionDefinitionDto[]>([]);
  rows = signal<BoundActionRow[]>([]);

  viewMode = signal<DefinitionsViewMode>('table');
  tableSearch = signal('');
  sortKey = signal('sequence');
  sortDir = signal<SortDirection>('asc');
  pageIndex = signal(0);
  pageSize = signal(12);

  lookupDto = signal<ActionDefinitionDto | null>(null);
  editId = signal<string | null>(null);

  readonly versionStatusLabel = versionStatusLabel;

  collection = computed(() =>
    applyCollection(this.rows(), {
      search: this.tableSearch(),
      match: (a, q) =>
        a.targetKey.toLowerCase().includes(q) ||
        a.actionCode.toLowerCase().includes(q) ||
        a.target.toLowerCase().includes(q),
      sortKey: this.sortKey(),
      sortDir: this.sortDir(),
      sortValue: (a, key) => {
        if (key === 'sequence') return a.sequence;
        return sortField(a, key);
      },
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    }),
  );

  ngOnInit() {
    this.actionDefsApi.findAll().subscribe((d) => {
      this.actionDefs.set(d);
      const vId = this.selectedVersionId();
      if (vId) this.loadActions(vId);
    });
    this.versionsApi.findAll(this.definitionId()).subscribe((v) => {
      const sorted = [...v].sort((a, b) => b.version - a.version);
      this.versions.set(sorted);
      const pick = sorted.find((x) => x.status === 'DRAFT') ?? sorted[0];
      if (pick) {
        this.selectedVersionId.set(pick.id);
        this.loadActions(pick.id);
      }
    });
  }

  onVersionChange(versionId: string) {
    this.selectedVersionId.set(versionId);
    this.loadActions(versionId);
  }

  onSearch(v: string) {
    this.tableSearch.set(v);
    this.pageIndex.set(0);
  }

  setSort(key: string) {
    const n = toggleSort(this.sortKey(), this.sortDir(), key);
    this.sortKey.set(n.sortKey);
    this.sortDir.set(n.sortDir);
  }

  loadActions(versionId: string) {
    const defId = this.definitionId();
    forkJoin({
      nodes: this.nodesApi.findByWorkflowVersion(defId, versionId),
      transitions: this.transitionsApi.findAll(defId, versionId),
    })
      .pipe(
        switchMap(({ nodes, transitions }) => {
          const nodeCalls = nodes.map((n) =>
            this.actionsApi.findAllByNode(n.id).pipe(
              map((actions) => actions.map((a) => this.toRow(a, 'Node', n.nodeKey))),
            ),
          );
          const transCalls = transitions.map((t) =>
            this.actionsApi.findAllByTransition(t.id).pipe(
              map((actions) => actions.map((a) => this.toRow(a, 'Transition', t.transitionKey))),
            ),
          );
          const all = [...nodeCalls, ...transCalls];
          if (!all.length) return of<BoundActionRow[]>([]);
          return forkJoin(all).pipe(map((chunks) => chunks.flat()));
        }),
      )
      .subscribe((list) => this.rows.set(list.sort((a, b) => a.sequence - b.sequence)));
  }

  toRow(a: WorkflowActionDto, target: string, targetKey: string): BoundActionRow {
    const def = this.actionDefs().find((d) => d.id === a.actionDefinitionId);
    return {
      id: a.id,
      target,
      targetKey,
      event: a.event ?? 'transition',
      sequence: a.sequence,
      active: a.active,
      actionDefinitionId: a.actionDefinitionId,
      actionCode: def?.code ?? a.actionDefinitionId.slice(0, 8),
    };
  }

  lookupDef(actionDefinitionId: string) {
    const cached = this.actionDefs().find((d) => d.id === actionDefinitionId);
    if (cached) {
      this.lookupDto.set(cached);
      return;
    }
    this.actionDefsApi.findOne(actionDefinitionId).subscribe((d) => this.lookupDto.set(d));
  }

  onEdited() {
    this.editId.set(null);
    this.loadActions(this.selectedVersionId());
  }
}
