import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesignerStore } from '../designer.store';
import { WorkflowNode, Transition } from '../../../domain/definition';
import { WorkflowActionsApiService } from '../../../data/api/workflow-actions-api.service';
import { ActionDefinitionsApiService } from '../../../data/api/action-definitions-api.service';
import { ActionDefinitionDto, WorkflowActionDto, WorkflowActionEvent } from '../../../data/api/api-models';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ModalShellComponent } from '../../../shared/ui/modal/modal-shell.component';
import { WorkflowActionEditPanelComponent } from '../../definitions/hub/workflow-action-edit-dialog.component';

@Component({
  selector: 'designer-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, WorkflowActionEditPanelComponent],
  template: `
    <div class="h-14 border-b border-slate-200 bg-slate-50 flex items-center px-4 shrink-0 shadow-sm">
      <h3 class="font-semibold text-slate-800 text-sm flex items-center gap-2">
        <i class="bi bi-sliders text-slate-500"></i> Properties
      </h3>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      @if (store.selectedNode()) {
        @let node = store.selectedNode()!;
        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
              <i class="bi" [ngClass]="getIcon(node.kind)"></i>
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase">{{ node.kind }}</div>
              <div class="text-sm font-mono text-slate-700">{{ node.id }}</div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="wfe-label">Label</label>
              <input class="wfe-input" [ngModel]="node.label" (ngModelChange)="updateNode(node.id, {label: $event})" />
            </div>
            <div>
              <label class="wfe-label">Description</label>
              <textarea class="wfe-input" rows="2" [ngModel]="node.description" (ngModelChange)="updateNode(node.id, {description: $event})"></textarea>
            </div>
            
            @if (node.kind === 'userTask' || node.kind === 'approval' || node.kind === 'review' || node.kind === 'start') {
              <div>
                <label class="wfe-label">Form ID</label>
                <input class="wfe-input" [ngModel]="node.formRef?.formId" (ngModelChange)="updateFormRef(node, {formId: $event})" placeholder="e.g. intake-form" />
              </div>
              <div>
                <label class="wfe-label">Form Version</label>
                <input type="number" class="wfe-input" [ngModel]="node.formRef?.formVersion || 1" (ngModelChange)="updateFormRef(node, {formVersion: $event})" />
              </div>
            }

            @if (node.kind === 'userTask' || node.kind === 'approval') {
              <div class="p-3 border border-slate-200 rounded bg-slate-50 mt-4 space-y-3">
                <h4 class="text-xs font-semibold text-slate-600 uppercase">Assignment</h4>
                <div>
                  <label class="wfe-label text-xs">Strategy</label>
                  <select class="wfe-select text-sm py-1.5" [ngModel]="node.assignment?.strategy || 'ROLE'" (ngModelChange)="updateAssignment(node, {strategy: $event})">
                    <option value="ROLE">Role</option>
                    <option value="FIXED_USER">Fixed User</option>
                    <option value="REPORTING_MANAGER">Reporting Manager</option>
                  </select>
                </div>
                @if ((node.assignment?.strategy || 'ROLE') === 'ROLE') {
                  <div>
                    <label class="wfe-label text-xs">Role Code</label>
                    <input class="wfe-input text-sm py-1.5" [ngModel]="node.assignment?.role" (ngModelChange)="updateAssignment(node, {role: $event})" placeholder="e.g. CASE_WORKER" />
                  </div>
                }
              </div>
            }

            <div class="border-t border-slate-200 mt-6 pt-4 space-y-4">
              <h4 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <i class="bi bi-lightning-charge"></i> Actions
              </h4>
              
              @if (!node.backendId) {
                <div class="text-xs p-3 bg-amber-50 text-amber-700 rounded border border-amber-200">
                  <i class="bi bi-exclamation-triangle mr-1"></i> Please save the workflow first to add actions to this node.
                </div>
              } @else {
                <div class="flex gap-2 items-end">
                  <div class="flex-1">
                    <label class="wfe-label text-xs">Filter by event</label>
                    <select class="wfe-select text-sm py-1" [(ngModel)]="nodeEventFilter" (ngModelChange)="reloadNodeActions(node.backendId)">
                      <option value="">All events</option>
                      <option value="ON_ENTER">On enter</option>
                      <option value="ON_EXIT">On exit</option>
                      <option value="ON_COMPLETE">On complete</option>
                    </select>
                  </div>
                </div>
                <ul class="space-y-2">
                  @for (wa of nodeActions(); track wa.id) {
                    <li class="p-2 border border-slate-200 rounded text-sm bg-white flex items-center justify-between gap-2">
                      <div>
                        <div class="font-medium text-slate-800">{{ getActionDefName(wa.actionDefinitionId) }}</div>
                        <div class="text-xs text-slate-500 font-mono">Event: {{ wa.event || 'NONE' }}</div>
                      </div>
                      <div class="flex gap-1 shrink-0">
                        <button type="button" class="text-indigo-600 hover:text-indigo-800" (click)="editWorkflowAction(wa.id)" title="Edit">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="text-red-500 hover:text-red-700" (click)="deleteAction(wa.id)"><i class="bi bi-trash"></i></button>
                      </div>
                    </li>
                  }
                </ul>

                <div class="bg-slate-50 p-3 rounded border border-slate-200 mt-2 space-y-3">
                  <div>
                    <label class="wfe-label text-xs">Action</label>
                    <select class="wfe-select text-sm py-1" [(ngModel)]="newAction.actionDefinitionId">
                      <option value="">-- Select Action --</option>
                      @for (ad of actionDefs(); track ad.id) {
                        <option [value]="ad.id">{{ ad.name }} ({{ ad.code }})</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="wfe-label text-xs">Event</label>
                    <select class="wfe-select text-sm py-1" [(ngModel)]="newAction.event">
                      <option value="ON_ENTER">On Enter</option>
                      <option value="ON_EXIT">On Exit</option>
                      <option value="ON_COMPLETE">On Complete</option>
                    </select>
                  </div>
                  <button class="wfe-btn wfe-btn-primary wfe-btn-sm w-full" 
                          [disabled]="!newAction.actionDefinitionId"
                          (click)="addActionToNode(node.backendId)">Add Action</button>
                </div>
              }
            </div>

            <button class="wfe-btn wfe-btn-danger wfe-btn-outline w-full mt-6" (click)="store.deleteNode(node.id)">
              <i class="bi bi-trash"></i> Delete Node
            </button>
          </div>
        </div>
      } @else if (store.selectedTransition()) {
        @let transition = store.selectedTransition()!;
        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
              <i class="bi bi-arrow-right"></i>
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase">Transition</div>
              <div class="text-sm font-mono text-slate-700">{{ transition.from }} &rarr; {{ transition.to }}</div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="wfe-label">Action Label</label>
              <input class="wfe-input" [ngModel]="transition.actionLabel" (ngModelChange)="updateTransition(transition.id, {actionLabel: $event})" placeholder="e.g. Approve" />
            </div>
            <div>
              <label class="wfe-label">Action Key</label>
              <input class="wfe-input" [ngModel]="transition.actionKey" (ngModelChange)="updateTransition(transition.id, {actionKey: $event})" placeholder="e.g. APPROVE" />
            </div>
            <div class="flex items-center gap-2 mt-4">
              <input type="checkbox" id="isDefaultCheck" [ngModel]="transition.isDefault" (ngModelChange)="updateTransition(transition.id, {isDefault: $event})" />
              <label for="isDefaultCheck" class="text-sm font-medium text-slate-700">Default Transition</label>
            </div>
            <div>
              <label class="wfe-label">Priority</label>
              <input type="number" class="wfe-input" [ngModel]="transition.priority" (ngModelChange)="updateTransition(transition.id, {priority: $event})" />
            </div>

            <div class="border-t border-slate-200 mt-6 pt-4 space-y-4">
              <h4 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <i class="bi bi-lightning-charge"></i> Actions
              </h4>
              
              @if (!transition.backendId) {
                <div class="text-xs p-3 bg-amber-50 text-amber-700 rounded border border-amber-200">
                  <i class="bi bi-exclamation-triangle mr-1"></i> Please save the workflow first to add actions to this transition.
                </div>
              } @else {
                <ul class="space-y-2">
                  @for (wa of transitionActions(); track wa.id) {
                    <li class="p-2 border border-slate-200 rounded text-sm bg-white flex items-center justify-between gap-2">
                      <div>
                        <div class="font-medium text-slate-800">{{ getActionDefName(wa.actionDefinitionId) }}</div>
                      </div>
                      <div class="flex gap-1 shrink-0">
                        <button type="button" class="text-indigo-600 hover:text-indigo-800" (click)="editWorkflowAction(wa.id)" title="Edit">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="text-red-500 hover:text-red-700" (click)="deleteAction(wa.id)"><i class="bi bi-trash"></i></button>
                      </div>
                    </li>
                  }
                </ul>

                <div class="bg-slate-50 p-3 rounded border border-slate-200 mt-2 space-y-3">
                  <div>
                    <label class="wfe-label text-xs">Action</label>
                    <select class="wfe-select text-sm py-1" [(ngModel)]="newAction.actionDefinitionId">
                      <option value="">-- Select Action --</option>
                      @for (ad of actionDefs(); track ad.id) {
                        <option [value]="ad.id">{{ ad.name }} ({{ ad.code }})</option>
                      }
                    </select>
                  </div>
                  <button class="wfe-btn wfe-btn-primary wfe-btn-sm w-full" 
                          [disabled]="!newAction.actionDefinitionId"
                          (click)="addActionToTransition(transition.backendId)">Add Action</button>
                </div>
              }
            </div>

            <button class="wfe-btn wfe-btn-danger wfe-btn-outline w-full mt-6" (click)="store.deleteTransition(transition.id)">
              <i class="bi bi-trash"></i> Delete Transition
            </button>
          </div>
        </div>
      } @else {
        <div class="space-y-6">
          <div class="text-center py-6 border-b border-slate-100">
            <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mx-auto mb-3 text-xl">
              <i class="bi bi-diagram-3-fill"></i>
            </div>
            <h4 class="text-slate-800 font-medium">Workflow Settings</h4>
            <p class="text-sm text-slate-500 mt-1">Select a node or transition to edit its properties, or configure global settings below.</p>
          </div>
          
          @let def = store.def();
          @if (def) {
            <div class="space-y-4">
              <div>
                <label class="wfe-label">Effective From</label>
                <input type="datetime-local" class="wfe-input" [ngModel]="def.effectiveFrom" (ngModelChange)="store.updateMeta({effectiveFrom: $event})" />
              </div>
              <div>
                <label class="wfe-label">Effective To</label>
                <input type="datetime-local" class="wfe-input" [ngModel]="def.effectiveTo" (ngModelChange)="store.updateMeta({effectiveTo: $event})" />
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (editingActionId) {
      <wfe-modal-shell title="Workflow action" size="md" (dismiss)="editingActionId = null">
        <workflow-action-edit-panel
          [actionId]="editingActionId"
          (saved)="onActionEdited(); editingActionId = null"
          (cancelled)="editingActionId = null"
        />
      </wfe-modal-shell>
    }
  `
})
export class PropertiesPanelComponent {
  store = inject(DesignerStore);
  private actionsApi = inject(WorkflowActionsApiService);
  private defsApi = inject(ActionDefinitionsApiService);
  private toast = inject(ToastService);
  editingActionId: string | null = null;

  actionDefs = signal<ActionDefinitionDto[]>([]);
  nodeActions = signal<WorkflowActionDto[]>([]);
  transitionActions = signal<WorkflowActionDto[]>([]);

  newAction: { actionDefinitionId: string, event: WorkflowActionEvent } = {
    actionDefinitionId: '',
    event: 'ON_ENTER'
  };
  nodeEventFilter: WorkflowActionEvent | '' = '';

  constructor() {
    this.defsApi.findActive().subscribe(defs => this.actionDefs.set(defs));

    effect(() => {
      const node = this.store.selectedNode();
      if (node?.backendId) {
        this.reloadNodeActions(node.backendId);
      } else {
        this.nodeActions.set([]);
        this.nodeEventFilter = '';
      }

      const trans = this.store.selectedTransition();
      if (trans?.backendId) {
        this.actionsApi.findAllByTransition(trans.backendId).subscribe(actions => this.transitionActions.set(actions));
      } else {
        this.transitionActions.set([]);
      }
    });
  }

  reloadNodeActions(nodeBackendId: string) {
    if (this.nodeEventFilter) {
      this.actionsApi
        .findByNodeAndEvent(nodeBackendId, this.nodeEventFilter)
        .subscribe((actions) => this.nodeActions.set(actions));
    } else {
      this.actionsApi
        .findAllByNode(nodeBackendId)
        .subscribe((actions) => this.nodeActions.set(actions));
    }
  }

  editWorkflowAction(actionId: string) {
    this.editingActionId = actionId;
  }

  onActionEdited() {
    const node = this.store.selectedNode();
    if (node?.backendId) {
      this.reloadNodeActions(node.backendId);
    }
    const trans = this.store.selectedTransition();
    if (trans?.backendId) {
      this.actionsApi
        .findAllByTransition(trans.backendId)
        .subscribe((actions) => this.transitionActions.set(actions));
    }
  }

  getActionDefName(id: string): string {
    return this.actionDefs().find(ad => ad.id === id)?.name || id;
  }

  addActionToNode(nodeBackendId: string) {
    this.actionsApi.create({
      workflowNodeId: nodeBackendId,
      actionDefinitionId: this.newAction.actionDefinitionId,
      event: this.newAction.event,
      active: true,
      sequence: 1
    }).subscribe({
      next: (wa) => {
        this.nodeActions.update(actions => [...actions, wa]);
        this.newAction.actionDefinitionId = '';
        this.toast.success('Action added to node');
      },
      error: () => this.toast.error('Failed to add action')
    });
  }

  addActionToTransition(transitionBackendId: string) {
    this.actionsApi.create({
      workflowTransitionId: transitionBackendId,
      actionDefinitionId: this.newAction.actionDefinitionId,
      active: true,
      sequence: 1
    }).subscribe({
      next: (wa) => {
        this.transitionActions.update(actions => [...actions, wa]);
        this.newAction.actionDefinitionId = '';
        this.toast.success('Action added to transition');
      },
      error: () => this.toast.error('Failed to add action')
    });
  }

  deleteAction(actionId: string) {
    this.actionsApi.deleteAction(actionId).subscribe({
      next: () => {
        this.nodeActions.update(actions => actions.filter(a => a.id !== actionId));
        this.transitionActions.update(actions => actions.filter(a => a.id !== actionId));
        this.toast.success('Action deleted');
      },
      error: () => this.toast.error('Failed to delete action')
    });
  }

  getIcon(kind: string): string {
    switch(kind) {
      case 'start': return 'bi-play-circle-fill';
      case 'end': return 'bi-stop-circle-fill';
      case 'userTask': return 'bi-person-fill';
      case 'approval': return 'bi-check2-square';
      case 'condition': return 'bi-diamond-fill';
      case 'parallelSplit': return 'bi-diagram-3-fill';
      default: return 'bi-circle-fill';
    }
  }

  updateNode(id: string, patch: Partial<WorkflowNode>) {
    this.store.updateNode(id, patch);
  }

  updateFormRef(node: WorkflowNode, patch: any) {
    const current = node.formRef || { formId: '', formVersion: 1 };
    this.store.updateNode(node.id, { formRef: { ...current, ...patch } });
  }

  updateAssignment(node: WorkflowNode, patch: any) {
    const current = node.assignment || { strategy: 'ROLE' };
    this.store.updateNode(node.id, { assignment: { ...current, ...patch } });
  }

  updateTransition(id: string, patch: Partial<Transition>) {
    this.store.updateTransition(id, patch);
  }
}
