import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkflowVersionsApiService } from '../../../../data/api/workflow-versions-api.service';
import { WorkflowNodesApiService } from '../../../../data/api/workflow-nodes-api.service';
import { WorkflowTransitionsApiService } from '../../../../data/api/workflow-transitions-api.service';
import {
  WorkflowNodeDto,
  WorkflowNodeType,
  WorkflowTransitionDto,
  WorkflowVersionDto,
} from '../../../../data/api/api-models';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
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

type NodeForm = {
  nodeKey: string;
  name: string;
  description: string;
  type: WorkflowNodeType;
  position: number;
};

type TransForm = {
  transitionKey: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  priority: number;
  isDefault: boolean;
};

@Component({
  selector: 'hub-structure-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DefinitionsCollectionToolbarComponent,
    DefinitionsPaginatorComponent,
    DefinitionsSortHeaderComponent,
    ModalShellComponent,
  ],
  template: `
    <div class="structure-hub" aria-label="Workflow structure">
      <header class="structure-context">
        <div class="context-field">
          <label class="wfe-label" for="structure-version-select">Working version</label>
          <select
            id="structure-version-select"
            class="wfe-select context-select"
            [ngModel]="selectedVersionId()"
            (ngModelChange)="onVersionChange($event)"
          >
            @for (v of versions(); track v.id) {
              <option [value]="v.id">
                Version {{ v.version }} — {{ versionStatusLabel(v.status) }}
              </option>
            }
          </select>
        </div>

        @if (selectedVersion(); as ver) {
          <span class="structure-status" [attr.data-status]="ver.status">
            {{ versionStatusLabel(ver.status) }}
          </span>
        }

        <dl class="context-metrics" aria-label="Structure summary">
          <div>
            <dt>Nodes</dt>
            <dd>{{ nodes().length }}</dd>
          </div>
          <div>
            <dt>Transitions</dt>
            <dd>{{ transitions().length }}</dd>
          </div>
        </dl>

        <button
          type="button"
          class="wfe-btn wfe-btn-outline context-refresh"
          (click)="refresh()"
          aria-label="Refresh nodes and transitions"
        >
          <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
          Refresh
        </button>
      </header>

      @if (!editable()) {
        <div class="structure-banner" role="status">
          <i class="bi bi-info-circle" aria-hidden="true"></i>
          <p>
            This version is read-only. Open the designer or create a <strong>draft</strong> to edit nodes and
            transitions.
          </p>
        </div>
      }

      <div class="structure-columns">
        <section class="structure-panel" aria-labelledby="structure-nodes-title">
          <div class="panel-top">
            <div class="panel-title-block">
              <h2 id="structure-nodes-title" class="panel-title">Nodes</h2>
              <p class="panel-subtitle">Tasks, gateways, and start/end points</p>
            </div>
            @if (editable()) {
              <button type="button" class="wfe-btn wfe-btn-primary" (click)="openNodeCreate()">
                <i class="bi bi-plus-lg" aria-hidden="true"></i>
                Add node
              </button>
            }
          </div>

          <definitions-collection-toolbar
            [compact]="true"
            [search]="nodeSearch()"
            [view]="nodeView()"
            (searchChange)="nodeSearch.set($event); nodePageIndex.set(0)"
            (viewChange)="nodeView.set($event)"
          />

          @if (nodeView() === 'table') {
            <div class="structure-table-wrap mt-3">
              <table class="wfe-table structure-table">
                <caption class="sr-only">
                  Nodes in the selected version. {{ nodeCollection().total }} total, showing page
                  {{ nodePageIndex() + 1 }}.
                </caption>
                <thead>
                  <tr>
                    <th scope="col" definitionsSortHeader="nodeKey" [activeKey]="nodeSortKey()" [direction]="nodeSortDir()" (sort)="setNodeSort($event)">
                      Key
                    </th>
                    <th scope="col" definitionsSortHeader="name" [activeKey]="nodeSortKey()" [direction]="nodeSortDir()" (sort)="setNodeSort($event)">
                      Name
                    </th>
                    <th scope="col" definitionsSortHeader="type" [activeKey]="nodeSortKey()" [direction]="nodeSortDir()" (sort)="setNodeSort($event)">
                      Type
                    </th>
                    @if (editable()) {
                      <th scope="col" class="col-actions"><span class="sr-only">Actions</span></th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (n of nodeCollection().page; track n.id) {
                    <tr>
                      <td><code class="structure-code">{{ n.nodeKey }}</code></td>
                      <td>{{ n.name }}</td>
                      <td>
                        <span class="type-chip" [attr.data-type]="n.type">{{ nodeTypeLabel(n.type) }}</span>
                      </td>
                      @if (editable()) {
                        <td class="col-actions">
                          <div class="wfe-icon-actions">
                            <button
                              type="button"
                              class="wfe-btn wfe-btn-ghost wfe-btn-icon structure-action-btn"
                              [attr.aria-label]="'Edit node ' + n.nodeKey"
                              (click)="openNodeEdit(n)"
                            >
                              <i class="bi bi-pencil" aria-hidden="true"></i>
                            </button>
                            <button
                              type="button"
                              class="wfe-btn wfe-btn-ghost wfe-btn-icon structure-action-btn"
                              [attr.aria-label]="'Delete node ' + n.nodeKey"
                              (click)="deleteNode(n)"
                            >
                              <i class="bi bi-trash" aria-hidden="true"></i>
                            </button>
                          </div>
                        </td>
                      }
                    </tr>
                  } @empty {
                    <tr>
                      <td [attr.colspan]="editable() ? 4 : 3">
                        <div class="structure-empty" role="status">
                          <i class="bi bi-diagram-2" aria-hidden="true"></i>
                          <p>No nodes match your search.</p>
                          @if (editable() && !nodeSearch()) {
                            <button type="button" class="wfe-btn wfe-btn-soft" (click)="openNodeCreate()">
                              Add your first node
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <ul class="structure-card-list" role="list">
              @for (n of nodeCollection().page; track n.id) {
                <li class="structure-card-item">
                  <article class="structure-card">
                    <header class="structure-card-head">
                      <code class="structure-code">{{ n.nodeKey }}</code>
                      <span class="type-chip" [attr.data-type]="n.type">{{ nodeTypeLabel(n.type) }}</span>
                    </header>
                    <p class="structure-card-body">{{ n.name }}</p>
                    @if (editable()) {
                      <footer class="structure-card-foot">
                        <button
                          type="button"
                          class="wfe-btn wfe-btn-ghost wfe-btn-sm"
                          (click)="openNodeEdit(n)"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="wfe-btn wfe-btn-ghost wfe-btn-sm"
                          (click)="deleteNode(n)"
                        >
                          Delete
                        </button>
                      </footer>
                    }
                  </article>
                </li>
              } @empty {
                <li class="structure-empty" role="status">
                  <i class="bi bi-diagram-2" aria-hidden="true"></i>
                  <p>No nodes to show.</p>
                </li>
              }
            </ul>
          }

          <definitions-paginator
            [pageIndex]="nodePageIndex()"
            [pageSize]="nodePageSize()"
            [total]="nodeCollection().total"
            [pageSizeOptions]="[5, 10, 20]"
            (pageIndexChange)="nodePageIndex.set($event)"
            (pageSizeChange)="nodePageSize.set($event)"
          />
        </section>

        <section class="structure-panel" aria-labelledby="structure-trans-title">
          <div class="panel-top">
            <div class="panel-title-block">
              <h2 id="structure-trans-title" class="panel-title">Transitions</h2>
              <p class="panel-subtitle">Paths between nodes</p>
            </div>
            @if (editable()) {
              <button
                type="button"
                class="wfe-btn wfe-btn-primary"
                [disabled]="!nodes().length"
                (click)="openTransCreate()"
              >
                <i class="bi bi-plus-lg" aria-hidden="true"></i>
                Add transition
              </button>
            }
          </div>

          <definitions-collection-toolbar
            [compact]="true"
            [search]="transSearch()"
            [view]="transView()"
            (searchChange)="transSearch.set($event); transPageIndex.set(0)"
            (viewChange)="transView.set($event)"
          />

          @if (transView() === 'table') {
            <div class="structure-table-wrap mt-3">
              <table class="wfe-table structure-table">
                <caption class="sr-only">
                  Transitions in the selected version. {{ transCollection().total }} total.
                </caption>
                <thead>
                  <tr>
                    <th scope="col" definitionsSortHeader="transitionKey" [activeKey]="transSortKey()" [direction]="transSortDir()" (sort)="setTransSort($event)">
                      Key
                    </th>
                    <th scope="col">Route</th>
                    <th scope="col" definitionsSortHeader="priority" [activeKey]="transSortKey()" [direction]="transSortDir()" (sort)="setTransSort($event)">
                      Priority
                    </th>
                    @if (editable()) {
                      <th scope="col" class="col-actions"><span class="sr-only">Actions</span></th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (t of transCollection().page; track t.id) {
                    <tr>
                      <td>
                        <code class="structure-code">{{ t.transitionKey }}</code>
                        @if (t.isDefault) {
                          <span class="default-tag">default</span>
                        }
                      </td>
                      <td>
                        <span class="route-pair">
                          <span class="route-node">{{ nodeLabel(t.fromNodeId) }}</span>
                          <i class="bi bi-arrow-right route-arrow" aria-hidden="true"></i>
                          <span class="route-node">{{ nodeLabel(t.toNodeId) }}</span>
                        </span>
                        <span class="sr-only">
                          From {{ nodeLabel(t.fromNodeId) }} to {{ nodeLabel(t.toNodeId) }}
                        </span>
                      </td>
                      <td>{{ t.priority }}</td>
                      @if (editable()) {
                        <td class="col-actions">
                          <div class="wfe-icon-actions">
                            <button
                              type="button"
                              class="wfe-btn wfe-btn-ghost wfe-btn-icon structure-action-btn"
                              [attr.aria-label]="'Edit transition ' + t.transitionKey"
                              (click)="openTransEdit(t)"
                            >
                              <i class="bi bi-pencil" aria-hidden="true"></i>
                            </button>
                            <button
                              type="button"
                              class="wfe-btn wfe-btn-ghost wfe-btn-icon structure-action-btn"
                              [attr.aria-label]="'Delete transition ' + t.transitionKey"
                              (click)="deleteTransition(t)"
                            >
                              <i class="bi bi-trash" aria-hidden="true"></i>
                            </button>
                          </div>
                        </td>
                      }
                    </tr>
                  } @empty {
                    <tr>
                      <td [attr.colspan]="editable() ? 4 : 3">
                        <div class="structure-empty" role="status">
                          <i class="bi bi-signpost-split" aria-hidden="true"></i>
                          <p>No transitions match your search.</p>
                          @if (editable() && !transSearch() && nodes().length) {
                            <button type="button" class="wfe-btn wfe-btn-soft" (click)="openTransCreate()">
                              Connect nodes with a transition
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <ul class="structure-card-list" role="list">
              @for (t of transCollection().page; track t.id) {
                <li class="structure-card-item">
                  <article class="structure-card">
                    <header class="structure-card-head">
                      <code class="structure-code">{{ t.transitionKey }}</code>
                      @if (t.isDefault) {
                        <span class="default-tag">default</span>
                      }
                    </header>
                    <p class="structure-card-body route-pair">
                      <span class="route-node">{{ nodeLabel(t.fromNodeId) }}</span>
                      <i class="bi bi-arrow-right route-arrow" aria-hidden="true"></i>
                      <span class="route-node">{{ nodeLabel(t.toNodeId) }}</span>
                    </p>
                    <p class="structure-card-meta">Priority {{ t.priority }}</p>
                    @if (editable()) {
                      <footer class="structure-card-foot">
                        <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-sm" (click)="openTransEdit(t)">
                          Edit
                        </button>
                        <button type="button" class="wfe-btn wfe-btn-ghost wfe-btn-sm" (click)="deleteTransition(t)">
                          Delete
                        </button>
                      </footer>
                    }
                  </article>
                </li>
              } @empty {
                <li class="structure-empty" role="status">
                  <i class="bi bi-signpost-split" aria-hidden="true"></i>
                  <p>No transitions to show.</p>
                </li>
              }
            </ul>
          }

          <definitions-paginator
            [pageIndex]="transPageIndex()"
            [pageSize]="transPageSize()"
            [total]="transCollection().total"
            [pageSizeOptions]="[5, 10, 20]"
            (pageIndexChange)="transPageIndex.set($event)"
            (pageSizeChange)="transPageSize.set($event)"
          />
        </section>
      </div>
    </div>

    @if (nodeModal(); as modal) {
      <wfe-modal-shell [title]="modal.title" [showFooter]="true" (dismiss)="nodeModal.set(null)">
        <form class="structure-form" (submit)="$event.preventDefault(); saveNode()">
          <div class="form-field">
            <label class="wfe-label" for="node-key">Node key</label>
            <input id="node-key" class="wfe-input" required [(ngModel)]="modal.model.nodeKey" name="nodeKey" />
          </div>
          <div class="form-field">
            <label class="wfe-label" for="node-name">Display name</label>
            <input id="node-name" class="wfe-input" required [(ngModel)]="modal.model.name" name="nodeName" />
          </div>
          <div class="form-field">
            <label class="wfe-label" for="node-type">Type</label>
            <select id="node-type" class="wfe-select" [(ngModel)]="modal.model.type" name="nodeType">
              <option value="START">Start</option>
              <option value="END">End</option>
              <option value="USER_TASK">User task</option>
              <option value="SERVICE_TASK">Service task</option>
              <option value="APPROVAL">Approval</option>
              <option value="EXCLUSIVE_GATEWAY">Exclusive gateway</option>
              <option value="PARALLEL_GATEWAY">Parallel gateway</option>
            </select>
          </div>
          <div class="form-field">
            <label class="wfe-label" for="node-position">Order position</label>
            <input id="node-position" type="number" class="wfe-input" [(ngModel)]="modal.model.position" name="nodePos" />
          </div>
          <div class="form-field">
            <label class="wfe-label" for="node-desc">Description</label>
            <textarea id="node-desc" class="wfe-input" rows="2" [(ngModel)]="modal.model.description" name="nodeDesc"></textarea>
          </div>
        </form>
        <div modalActions>
          <button type="button" class="wfe-btn wfe-btn-primary" (click)="saveNode()">Save node</button>
          <button type="button" class="wfe-btn wfe-btn-ghost" (click)="nodeModal.set(null)">Cancel</button>
        </div>
      </wfe-modal-shell>
    }

    @if (transModal(); as modal) {
      <wfe-modal-shell [title]="modal.title" [showFooter]="true" (dismiss)="transModal.set(null)">
        <form class="structure-form" (submit)="$event.preventDefault(); saveTransition()">
          <div class="form-field">
            <label class="wfe-label" for="trans-key">Transition key</label>
            <input id="trans-key" class="wfe-input" required [(ngModel)]="modal.model.transitionKey" name="transKey" />
          </div>
          <div class="form-field">
            <label class="wfe-label" for="trans-name">Display name</label>
            <input id="trans-name" class="wfe-input" [(ngModel)]="modal.model.name" name="transName" />
          </div>
          <div class="form-field">
            <label class="wfe-label" for="trans-from">From node</label>
            <select id="trans-from" class="wfe-select" [(ngModel)]="modal.model.fromNodeId" name="transFrom">
              @for (n of nodes(); track n.id) {
                <option [value]="n.id">{{ n.nodeKey }} — {{ n.name }}</option>
              }
            </select>
          </div>
          <div class="form-field">
            <label class="wfe-label" for="trans-to">To node</label>
            <select id="trans-to" class="wfe-select" [(ngModel)]="modal.model.toNodeId" name="transTo">
              @for (n of nodes(); track n.id) {
                <option [value]="n.id">{{ n.nodeKey }} — {{ n.name }}</option>
              }
            </select>
          </div>
          <div class="form-field">
            <label class="wfe-label" for="trans-priority">Priority</label>
            <input id="trans-priority" type="number" class="wfe-input" [(ngModel)]="modal.model.priority" name="transPri" />
          </div>
          <label class="structure-check">
            <input type="checkbox" [(ngModel)]="modal.model.isDefault" name="transDefault" />
            Use as default transition from this node
          </label>
        </form>
        <div modalActions>
          <button type="button" class="wfe-btn wfe-btn-primary" (click)="saveTransition()">Save transition</button>
          <button type="button" class="wfe-btn wfe-btn-ghost" (click)="transModal.set(null)">Cancel</button>
        </div>
      </wfe-modal-shell>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }

    .structure-hub {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .structure-context {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 0.75rem 1.25rem;
      padding: 1rem 1.1rem;
      background: var(--bg-elevated, #fff);
      border: 1px solid var(--border-subtle, #e4e6ee);
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }

    .context-field {
      flex: 1 1 14rem;
      min-width: 12rem;
      max-width: 22rem;
    }

    .context-select {
      width: 100%;
      margin-top: 0.2rem;
    }

    .structure-status {
      align-self: center;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 1px solid transparent;
    }

    .structure-status[data-status='DRAFT'] {
      background: #fef3c7;
      color: #92400e;
      border-color: #fcd34d;
    }

    .structure-status[data-status='PUBLISHED'] {
      background: #d1fae5;
      color: #065f46;
      border-color: #6ee7b7;
    }

    .structure-status[data-status='ARCHIVED'] {
      background: #f1f5f9;
      color: #475569;
      border-color: #cbd5e1;
    }

    .context-metrics {
      display: flex;
      gap: 1.25rem;
      margin: 0;
      padding: 0.35rem 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .context-metrics dt {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0;
    }

    .context-metrics dd {
      margin: 0.1rem 0 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.1;
    }

    .context-refresh {
      margin-left: auto;
    }

    .structure-banner {
      display: flex;
      gap: 0.65rem;
      align-items: flex-start;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e3a8a;
      font-size: 0.875rem;
      line-height: 1.45;
    }

    .structure-banner p {
      margin: 0;
    }

    .structure-columns {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 1rem;
      align-items: start;
    }

    @media (max-width: 960px) {
      .structure-columns {
        grid-template-columns: 1fr;
      }
    }

    .structure-panel {
      min-width: 0;
      padding: 1rem 1rem 0.75rem;
      background: var(--bg-elevated, #fff);
      border: 1px solid var(--border-subtle, #e4e6ee);
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }

    .panel-top {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .panel-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .panel-subtitle {
      margin: 0.2rem 0 0;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .structure-table-wrap {
      overflow: auto;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 0.5rem;
    }

    .structure-table {
      margin: 0;
    }

    .structure-table th,
    .structure-table td {
      vertical-align: middle;
    }

    .col-actions {
      width: 5.5rem;
      text-align: right;
    }

    .structure-code {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 0.75rem;
      font-weight: 600;
      color: #4338ca;
      background: #f5f3ff;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }

    .type-chip {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.2rem 0.45rem;
      border-radius: 6px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
    }

    .type-chip[data-type='START'] {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }

    .type-chip[data-type='END'] {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }

    .type-chip[data-type='APPROVAL'] {
      background: #fff7ed;
      color: #c2410c;
      border-color: #fed7aa;
    }

    .default-tag {
      margin-left: 0.35rem;
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #6366f1;
    }

    .route-pair {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
    }

    .route-node {
      padding: 0.1rem 0.4rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-weight: 600;
      color: #334155;
    }

    .route-arrow {
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .structure-card-list {
      list-style: none;
      margin: 0 0 0.5rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .structure-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.65rem 0.75rem;
      background: #fafbfc;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .structure-card:focus-within {
      border-color: #a5b4fc;
      box-shadow: 0 0 0 3px rgb(99 102 241 / 0.15);
    }

    .structure-card-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
      justify-content: space-between;
    }

    .structure-card-body {
      margin: 0.4rem 0 0;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .structure-card-meta {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      color: #64748b;
    }

    .structure-card-foot {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .structure-empty {
      text-align: center;
      padding: 1.5rem 1rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .structure-empty i {
      font-size: 1.5rem;
      display: block;
      margin-bottom: 0.5rem;
      color: #94a3b8;
    }

    .structure-empty p {
      margin: 0 0 0.75rem;
    }

    .structure-action-btn:focus-visible,
    .context-refresh:focus-visible,
    .structure-panel :focus-visible {
      outline: 2px solid #4f46e5;
      outline-offset: 2px;
    }

    .structure-form {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .structure-check {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #334155;
      cursor: pointer;
    }
  `,
})
export class HubStructureTabComponent implements OnInit {
  definitionId = input.required<string>();

  private versionsApi = inject(WorkflowVersionsApiService);
  private nodesApi = inject(WorkflowNodesApiService);
  private transitionsApi = inject(WorkflowTransitionsApiService);
  private toast = inject(ToastService);

  versions = signal<WorkflowVersionDto[]>([]);
  selectedVersionId = signal('');
  nodes = signal<WorkflowNodeDto[]>([]);
  transitions = signal<WorkflowTransitionDto[]>([]);

  nodeView = signal<DefinitionsViewMode>('table');
  transView = signal<DefinitionsViewMode>('table');
  nodeSearch = signal('');
  transSearch = signal('');
  nodeSortKey = signal('position');
  nodeSortDir = signal<SortDirection>('asc');
  transSortKey = signal('priority');
  transSortDir = signal<SortDirection>('asc');
  nodePageIndex = signal(0);
  nodePageSize = signal(10);
  transPageIndex = signal(0);
  transPageSize = signal(10);

  nodeModal = signal<{ title: string; id?: string; model: NodeForm } | null>(null);
  transModal = signal<{ title: string; id?: string; model: TransForm } | null>(null);

  readonly versionStatusLabel = versionStatusLabel;

  selectedVersion = computed(() =>
    this.versions().find((v) => v.id === this.selectedVersionId()) ?? null,
  );

  editable = computed(() => this.selectedVersion()?.status === 'DRAFT');

  nodeCollection = computed(() =>
    applyCollection(this.nodes(), {
      search: this.nodeSearch(),
      match: (n, q) =>
        n.nodeKey.toLowerCase().includes(q) || n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q),
      sortKey: this.nodeSortKey(),
      sortDir: this.nodeSortDir(),
      sortValue: (n, key) => (key === 'position' ? n.position : sortField(n, key)),
      pageIndex: this.nodePageIndex(),
      pageSize: this.nodePageSize(),
    }),
  );

  transCollection = computed(() =>
    applyCollection(this.transitions(), {
      search: this.transSearch(),
      match: (t, q) =>
        t.transitionKey.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        this.nodeLabel(t.fromNodeId).toLowerCase().includes(q),
      sortKey: this.transSortKey(),
      sortDir: this.transSortDir(),
      sortValue: (t, key) => (key === 'priority' ? t.priority : sortField(t, key)),
      pageIndex: this.transPageIndex(),
      pageSize: this.transPageSize(),
    }),
  );

  ngOnInit() {
    this.versionsApi.findAll(this.definitionId()).subscribe((v) => {
      const sorted = [...v].sort((a, b) => b.version - a.version);
      this.versions.set(sorted);
      const draft = sorted.find((x) => x.status === 'DRAFT');
      const pick = draft ?? sorted[0];
      if (pick) {
        this.selectedVersionId.set(pick.id);
        this.loadStructure(pick.id);
      }
    });
  }

  refresh() {
    const id = this.selectedVersionId();
    if (id) this.loadStructure(id);
  }

  onVersionChange(versionId: string) {
    this.selectedVersionId.set(versionId);
    this.nodePageIndex.set(0);
    this.transPageIndex.set(0);
    this.loadStructure(versionId);
  }

  loadStructure(versionId: string) {
    const defId = this.definitionId();
    this.nodesApi.findByWorkflowVersion(defId, versionId).subscribe((nodes) => {
      this.nodes.set([...nodes].sort((a, b) => a.position - b.position));
    });
    this.transitionsApi.findAll(defId, versionId).subscribe((trans) => {
      this.transitions.set([...trans].sort((a, b) => a.priority - b.priority));
    });
  }

  nodeLabel(id: string): string {
    return this.nodes().find((n) => n.id === id)?.nodeKey ?? id.slice(0, 8);
  }

  nodeTypeLabel(type: WorkflowNodeType): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  setNodeSort(key: string) {
    const n = toggleSort(this.nodeSortKey(), this.nodeSortDir(), key);
    this.nodeSortKey.set(n.sortKey);
    this.nodeSortDir.set(n.sortDir);
  }

  setTransSort(key: string) {
    const n = toggleSort(this.transSortKey(), this.transSortDir(), key);
    this.transSortKey.set(n.sortKey);
    this.transSortDir.set(n.sortDir);
  }

  openNodeCreate() {
    this.nodeModal.set({
      title: 'New node',
      model: { nodeKey: '', name: '', description: '', type: 'USER_TASK', position: this.nodes().length },
    });
  }

  openNodeEdit(n: WorkflowNodeDto) {
    this.nodeModal.set({
      title: 'Edit node',
      id: n.id,
      model: {
        nodeKey: n.nodeKey,
        name: n.name,
        description: n.description || '',
        type: n.type,
        position: n.position,
      },
    });
  }

  saveNode() {
    const m = this.nodeModal();
    if (!m?.model.nodeKey) return;
    const vId = this.selectedVersionId();
    const defId = this.definitionId();
    const body = {
      nodeKey: m.model.nodeKey,
      name: m.model.name,
      description: m.model.description || undefined,
      type: m.model.type,
      position: m.model.position,
    };
    const req = m.id
      ? this.nodesApi.update(defId, vId, m.id, body)
      : this.nodesApi.create(defId, vId, body);
    req.subscribe({
      next: () => {
        this.toast.success(m.id ? 'Node updated' : 'Node created');
        this.nodeModal.set(null);
        this.loadStructure(vId);
      },
      error: () => this.toast.error('Save node failed'),
    });
  }

  deleteNode(n: WorkflowNodeDto) {
    if (!confirm(`Delete node "${n.nodeKey}"?`)) return;
    this.nodesApi.remove(this.definitionId(), this.selectedVersionId(), n.id).subscribe({
      next: () => {
        this.toast.success('Node deleted');
        this.loadStructure(this.selectedVersionId());
      },
      error: () => this.toast.error('Delete node failed'),
    });
  }

  openTransCreate() {
    const list = this.nodes();
    this.transModal.set({
      title: 'New transition',
      model: {
        transitionKey: '',
        name: '',
        fromNodeId: list[0]?.id ?? '',
        toNodeId: list[1]?.id ?? list[0]?.id ?? '',
        priority: 0,
        isDefault: false,
      },
    });
  }

  openTransEdit(t: WorkflowTransitionDto) {
    this.transModal.set({
      title: 'Edit transition',
      id: t.id,
      model: {
        transitionKey: t.transitionKey,
        name: t.name,
        fromNodeId: t.fromNodeId,
        toNodeId: t.toNodeId,
        priority: t.priority,
        isDefault: t.isDefault,
      },
    });
  }

  saveTransition() {
    const m = this.transModal();
    if (!m?.model.transitionKey) return;
    const vId = this.selectedVersionId();
    const defId = this.definitionId();
    const req = m.id
      ? this.transitionsApi.update(defId, vId, m.id, m.model)
      : this.transitionsApi.create(defId, vId, m.model);
    req.subscribe({
      next: () => {
        this.toast.success(m.id ? 'Transition updated' : 'Transition created');
        this.transModal.set(null);
        this.loadStructure(vId);
      },
      error: () => this.toast.error('Save transition failed'),
    });
  }

  deleteTransition(t: WorkflowTransitionDto) {
    if (!confirm(`Delete transition "${t.transitionKey}"?`)) return;
    this.transitionsApi.deleteTransition(this.definitionId(), this.selectedVersionId(), t.id).subscribe({
      next: () => {
        this.toast.success('Transition deleted');
        this.loadStructure(this.selectedVersionId());
      },
      error: () => this.toast.error('Delete transition failed'),
    });
  }
}
