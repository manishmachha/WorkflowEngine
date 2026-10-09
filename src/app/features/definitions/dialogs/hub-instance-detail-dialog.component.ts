import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { WorkflowInstanceDto } from '../../../data/api/api-models';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'hub-instance-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, RelativeTimePipe],
  template: `
    <h2 mat-dialog-title>Instance</h2>
    <mat-dialog-content>
      <dl class="grid">
        <div><dt>Business key</dt><dd>{{ data.businessKey || '—' }}</dd></div>
        <div><dt>Status</dt><dd>{{ data.status }}</dd></div>
        <div><dt>Started</dt><dd>{{ data.startedAt | relTime }}</dd></div>
        <div><dt>Waiting</dt><dd>{{ data.waitingReason || '—' }}</dd></div>
      </dl>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      min-width: 360px;
    }
    dt {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      opacity: 0.75;
    }
    dd {
      margin: 0.15rem 0 0;
    }
  `,
})
export class HubInstanceDetailDialogComponent {
  data = inject<WorkflowInstanceDto>(MAT_DIALOG_DATA);
}
