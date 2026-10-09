import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ActionDefinitionDto } from '../../../data/api/api-models';

@Component({
  selector: 'action-lookup-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.code }}</h2>
    <mat-dialog-content>
      <dl class="lookup-grid">
        <div>
          <dt>Name</dt>
          <dd>{{ data.name }}</dd>
        </div>
        <div>
          <dt>Handler</dt>
          <dd class="mono">{{ data.handlerKey }}</dd>
        </div>
        <div class="span-2">
          <dt>Description</dt>
          <dd>{{ data.description || '—' }}</dd>
        </div>
      </dl>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    .lookup-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      min-width: 360px;
    }
    .span-2 {
      grid-column: span 2;
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
    .mono {
      font-family: JetBrains Mono, monospace;
      font-size: 0.8rem;
    }
  `,
})
export class ActionLookupDialogComponent {
  data = inject<ActionDefinitionDto>(MAT_DIALOG_DATA);
}
