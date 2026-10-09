import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { WorkflowDefinitionDto } from '../../../data/api/api-models';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
@Component({
  selector: 'definition-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, RouterLink, RelativeTimePipe],
  template: `
    <h2 mat-dialog-title>{{ data.name }}</h2>
    <mat-dialog-content class="definition-dialog-content">
      <p class="text-mono">{{ data.workflowKey }}</p>
      <dl class="detail-grid">
        <div>
          <dt>ID</dt>
          <dd>{{ data.id }}</dd>
        </div>
        <div>
          <dt>Organization</dt>
          <dd>{{ data.organizationId }}</dd>
        </div>
        <div class="span-2">
          <dt>Description</dt>
          <dd>{{ data.description || '—' }}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{{ data.active ? 'Yes' : 'No' }}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{{ data.updatedAt | relTime }}</dd>
        </div>
      </dl>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <a mat-flat-button color="primary" [routerLink]="['/definitions', data.id]" (click)="close()">
        Open hub
      </a>
    </mat-dialog-actions>
  `,
  styles: `
    .definition-dialog-content {
      min-width: min(480px, 92vw);
      color: var(--mat-sys-on-surface);
    }
    .text-mono {
      font-family: JetBrains Mono, monospace;
      font-size: 0.8rem;
      opacity: 0.85;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem 1rem;
      margin-top: 1rem;
    }
    .span-2 {
      grid-column: span 2;
    }
    dt {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      opacity: 0.75;
    }
    dd {
      margin: 0.15rem 0 0;
      font-size: 0.875rem;
    }
  `,
})
export class DefinitionDetailDialogComponent {
  data = inject<WorkflowDefinitionDto>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<DefinitionDetailDialogComponent>);

  close() {
    this.dialogRef.close();
  }
}
