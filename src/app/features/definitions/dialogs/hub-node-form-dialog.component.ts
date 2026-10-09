import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { WorkflowNodeType } from '../../../data/api/api-models';

export interface HubNodeFormDialogData {
  title: string;
  model: {
    nodeKey: string;
    name: string;
    description: string;
    type: WorkflowNodeType;
    position: number;
  };
}

export type HubNodeFormDialogResult = HubNodeFormDialogData['model'];

@Component({
  selector: 'hub-node-form-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="dialog-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Node key</mat-label>
        <input matInput [(ngModel)]="data.model.nodeKey" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="data.model.name" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Type</mat-label>
        <mat-select [(ngModel)]="data.model.type">
          <mat-option value="START">Start</mat-option>
          <mat-option value="END">End</mat-option>
          <mat-option value="TASK">Task</mat-option>
          <mat-option value="APPROVAL">Approval</mat-option>
          <mat-option value="EXCLUSIVE_GATEWAY">Exclusive gateway</mat-option>
          <mat-option value="PARALLEL_GATEWAY">Parallel gateway</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="half-width">
        <mat-label>Position</mat-label>
        <input matInput type="number" [(ngModel)]="data.model.position" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea matInput rows="2" [(ngModel)]="data.model.description"></textarea>
      </mat-form-field>
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
export class HubNodeFormDialogComponent {
  data = inject<HubNodeFormDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<HubNodeFormDialogComponent, HubNodeFormDialogResult>);

  save() {
    this.dialogRef.close({ ...this.data.model });
  }
}
