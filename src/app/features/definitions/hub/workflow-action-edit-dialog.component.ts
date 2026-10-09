import { Component, inject, input, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkflowActionsApiService } from '../../../data/api/workflow-actions-api.service';
import { ActionDefinitionsApiService } from '../../../data/api/action-definitions-api.service';
import {
  ActionDefinitionDto,
  WorkflowActionDto,
  WorkflowActionEvent,
} from '../../../data/api/api-models';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'workflow-action-edit-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (loading) {
      <p class="text-sm text-slate-500">Loading…</p>
    } @else {
      <div class="space-y-4">
        <div>
          <label class="wfe-label">Action definition</label>
          <select class="wfe-select" [(ngModel)]="draft.actionDefinitionId">
            @for (ad of actionDefs; track ad.id) {
              <option [value]="ad.id">{{ ad.name }} ({{ ad.code }})</option>
            }
          </select>
        </div>
        <div>
          <label class="wfe-label">Event</label>
          <select class="wfe-select" [(ngModel)]="draft.event">
            <option [ngValue]="null">None (transition)</option>
            <option value="ON_ENTER">On enter</option>
            <option value="ON_EXIT">On exit</option>
            <option value="ON_COMPLETE">On complete</option>
          </select>
        </div>
        <div>
          <label class="wfe-label">Sequence</label>
          <input type="number" class="wfe-input" [(ngModel)]="draft.sequence" />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" [(ngModel)]="draft.active" />
          Active
        </label>
        <div>
          <label class="wfe-label">Configuration (JSON)</label>
          <textarea class="wfe-input font-mono text-sm" rows="5" [(ngModel)]="configJson"></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="wfe-btn wfe-btn-ghost" (click)="cancelled.emit()">Cancel</button>
          <button type="button" class="wfe-btn wfe-btn-primary" (click)="save()">Save</button>
        </div>
      </div>
    }
  `,
})
export class WorkflowActionEditPanelComponent implements OnInit {
  actionId = input.required<string>();
  saved = output<WorkflowActionDto>();
  cancelled = output<void>();

  private actionsApi = inject(WorkflowActionsApiService);
  private defsApi = inject(ActionDefinitionsApiService);
  private toast = inject(ToastService);

  loading = true;
  actionDefs: ActionDefinitionDto[] = [];
  draft: {
    actionDefinitionId: string;
    event: WorkflowActionEvent | null;
    sequence: number;
    active: boolean;
  } = { actionDefinitionId: '', event: null, sequence: 1, active: true };
  configJson = '{}';

  ngOnInit() {
    this.defsApi.findActive().subscribe((d) => (this.actionDefs = d));
    this.actionsApi.findOne(this.actionId()).subscribe({
      next: (wa) => {
        this.draft = {
          actionDefinitionId: wa.actionDefinitionId,
          event: wa.event,
          sequence: wa.sequence,
          active: wa.active,
        };
        this.configJson = JSON.stringify(wa.configuration ?? {}, null, 2);
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load workflow action');
        this.cancelled.emit();
      },
    });
  }

  save() {
    let configuration: Record<string, unknown> | undefined;
    try {
      configuration = JSON.parse(this.configJson || '{}');
    } catch {
      this.toast.error('Configuration must be valid JSON');
      return;
    }
    this.actionsApi
      .update(this.actionId(), {
        actionDefinitionId: this.draft.actionDefinitionId,
        event: this.draft.event ?? undefined,
        sequence: this.draft.sequence,
        active: this.draft.active,
        configuration,
      })
      .subscribe({
        next: (wa) => {
          this.toast.success('Workflow action updated');
          this.saved.emit(wa);
        },
        error: () => this.toast.error('Update failed'),
      });
  }
}
