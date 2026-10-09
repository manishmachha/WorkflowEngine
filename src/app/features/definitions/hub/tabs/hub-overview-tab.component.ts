import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DefinitionsApi } from '../../../../data/definitions.api';
import { WorkflowDefinitionsApiService } from '../../../../data/api/workflow-definitions-api.service';
import { WorkflowVersionsApiService } from '../../../../data/api/workflow-versions-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { StartInstancePanelComponent } from '../../start-instance-dialog.component';
import { WorkflowVersionDto } from '../../../../data/api/api-models';

@Component({
  selector: 'hub-overview-tab',
  standalone: true,
  imports: [FormsModule, RouterLink, RelativeTimePipe, ModalShellComponent, StartInstancePanelComponent],
  template: `
    <div class="grid md:grid-cols-2 gap-4">
      <div class="wfe-card p-5 space-y-4">
        <h2 class="text-sm font-bold text-slate-800">Definition metadata</h2>
        @if (defDto) {
          <div class="text-xs text-slate-500 space-y-1 mb-2">
            <div><span class="wfe-dt">Workflow key</span> <span class="font-mono">{{ defDto.workflowKey }}</span></div>
            <div><span class="wfe-dt">Updated</span> {{ defDto.updatedAt | relTime }}</div>
          </div>
        }
        <div>
          <label class="wfe-label">Name</label>
          <input class="wfe-input" [(ngModel)]="editMeta.name" />
        </div>
        <div>
          <label class="wfe-label">Workflow key</label>
          <input class="wfe-input" [(ngModel)]="editMeta.workflowKey" />
        </div>
        <div>
          <label class="wfe-label">Description</label>
          <textarea class="wfe-input" rows="2" [(ngModel)]="editMeta.description"></textarea>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" [(ngModel)]="editMeta.active" />
          Definition active
        </label>
        <button type="button" class="wfe-btn wfe-btn-primary" (click)="save()">
          <i class="bi bi-save"></i> Save
        </button>
      </div>

      <div class="wfe-card p-5 space-y-4">
        <h2 class="text-sm font-bold text-slate-800">Quick links</h2>
        @if (latestVersion) {
          <p class="text-sm text-slate-600">Latest version v{{ latestVersion.version }}</p>
          <div class="flex flex-wrap gap-2">
            <a class="wfe-btn wfe-btn-outline" [routerLink]="['/designer', definitionId(), latestVersion.version]">
              <i class="bi bi-pencil-square"></i> Designer
            </a>
            <a class="wfe-btn wfe-btn-outline" [routerLink]="['/simulate', definitionId(), latestVersion.version]">
              <i class="bi bi-lightning"></i> Simulate
            </a>
            <button
              type="button"
              class="wfe-btn wfe-btn-primary"
              [disabled]="latestVersion.status !== 'PUBLISHED'"
              (click)="openStart()"
            >
              <i class="bi bi-play-fill"></i> Start
            </button>
          </div>
        } @else {
          <p class="text-sm text-slate-500">No versions yet.</p>
        }
      </div>
    </div>

    @if (startDef) {
      <wfe-modal-shell
        [title]="'Start instance'"
        [subtitle]="startDef.name + ' · v' + startDef.version"
        size="lg"
        (dismiss)="startDef = null"
      >
        <start-instance-panel [def]="startDef" (cancelled)="startDef = null" (started)="startDef = null" />
      </wfe-modal-shell>
    }
  `,
})
export class HubOverviewTabComponent implements OnInit {
  definitionId = input.required<string>();

  private defApi = inject(WorkflowDefinitionsApiService);
  private versionsApi = inject(WorkflowVersionsApiService);
  private api = inject(DefinitionsApi);
  private toast = inject(ToastService);

  defDto: import('../../../../data/api/api-models').WorkflowDefinitionDto | null = null;
  latestVersion: WorkflowVersionDto | null = null;
  editMeta = { name: '', workflowKey: '', description: '', active: true };
  startDef: import('../../../../domain/definition').WorkflowDefinition | null = null;

  ngOnInit() {
    this.reload();
  }

  reload() {
    const id = this.definitionId();
    this.defApi.findOne(id).subscribe((d) => {
      this.defDto = d;
      this.editMeta = {
        name: d.name,
        workflowKey: d.workflowKey,
        description: d.description || '',
        active: d.active,
      };
    });
    this.versionsApi.findAll(id).subscribe((versions) => {
      const sorted = [...versions].sort((a, b) => b.version - a.version);
      this.latestVersion = sorted[0] ?? null;
    });
  }

  save() {
    this.defApi.update(this.definitionId(), this.editMeta).subscribe({
      next: () => {
        this.toast.success('Definition updated');
        this.reload();
      },
      error: () => this.toast.error('Update failed'),
    });
  }

  openStart() {
    const v = this.latestVersion;
    if (!v) return;
    this.api.get(this.definitionId(), v.version).subscribe((d) => {
      if (d) this.startDef = d;
    });
  }
}
