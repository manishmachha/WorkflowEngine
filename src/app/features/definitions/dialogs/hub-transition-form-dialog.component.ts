import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { WorkflowNodeDto } from '../../../data/api/api-models';

export interface HubTransitionFormDialogData {
  title: string;
  nodes: WorkflowNodeDto[];
  model: {
    transitionKey: string;
    name: string;
    fromNodeId: string;
    toNodeId: string;
    priority: number;
    isDefault: boolean;
  };
}

export type HubTransitionFormDialogResult = HubTransitionFormDialogData['model'];

@Component({
  selector: 'hub-transition-form-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="dialog-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Transition key</mat-label>
        <input matInput [(ngModel)]="data.model.transitionKey" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="data.model.name" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>From node</mat-label>
        <mat-select [(ngModel)]="data.model.fromNodeId">
          @for (n of data.nodes; track n.id) {
            <mat-option [value]="n.id">{{ n.nodeKey }} — {{ n.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>To node</mat-label>
        <mat-select [(ngModel)]="data.model.toNodeId">
          @for (n of data.nodes; track n.id) {
            <mat-option [value]="n.id">{{ n.nodeKey }} — {{ n.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="half-width">
        <mat-label>Priority</mat-label>
        <input matInput type="number" [(ngModel)]="data.model.priority" />
      </mat-form-field>
      <mat-checkbox [(ngModel)]="data.model.isDefault">Default transition</mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: min(440px, 92vw);
      padding-top: 0.5rem;
    }
    .full-width {
      width: 100%;
    }
    .half-width {
      width: 48%;
    }
  `,
})
export class HubTransitionFormDialogComponent {
  data = inject<HubTransitionFormDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<HubTransitionFormDialogComponent, HubTransitionFormDialogResult>);

  save() {
    this.dialogRef.close({ ...this.data.model });
  }
}
