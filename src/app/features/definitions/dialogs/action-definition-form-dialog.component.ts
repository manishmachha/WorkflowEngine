import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActionDefinitionType } from '../../../data/api/api-models';

export interface ActionDefinitionFormDialogData {
  title: string;
  model: {
    name: string;
    code: string;
    description: string;
    type: ActionDefinitionType;
    handlerKey: string;
  };
}

export interface ActionDefinitionFormDialogResult {
  model: ActionDefinitionFormDialogData['model'];
}

@Component({
  selector: 'action-definition-form-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="dialog-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="data.model.name" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Code</mat-label>
        <input matInput [(ngModel)]="data.model.code" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Type</mat-label>
        <mat-select [(ngModel)]="data.model.type">
          <mat-option value="SYSTEM">System</mat-option>
          <mat-option value="CUSTOM">Custom</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Handler key</mat-label>
        <input matInput [(ngModel)]="data.model.handlerKey" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea matInput rows="3" [(ngModel)]="data.model.description"></textarea>
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
  `,
})
export class ActionDefinitionFormDialogComponent {
  data = inject<ActionDefinitionFormDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ActionDefinitionFormDialogComponent, ActionDefinitionFormDialogResult>);

  save() {
    this.dialogRef.close({ model: { ...this.data.model } });
  }
}
