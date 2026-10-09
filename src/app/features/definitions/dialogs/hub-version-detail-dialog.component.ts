import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WorkflowVersionDto } from '../../../data/api/api-models';
import { isDraftVersion, versionStatusLabel } from '../workflow-version-lifecycle';

export interface HubVersionDetailDialogData {
  version: WorkflowVersionDto;
  startingDate: string;
  expiryDate: string;
}

export interface HubVersionDetailDialogResult {
  startingDate: string;
  expiryDate: string;
}

@Component({
  selector: 'hub-version-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Version v{{ data.version.version }}</h2>
    <mat-dialog-content>
      <p>Status: {{ versionStatusLabel(data.version.status) }}</p>
      @if (isDraftVersion(data.version.status)) {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Starting date</mat-label>
          <input matInput type="datetime-local" [(ngModel)]="data.startingDate" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Expiry date</mat-label>
          <input matInput type="datetime-local" [(ngModel)]="data.expiryDate" />
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      @if (isDraftVersion(data.version.status)) {
        <button mat-flat-button color="primary" (click)="save()">Save dates</button>
      }
    </mat-dialog-actions>
  `,
  styles: `.full-width { width: 100%; }`,
})
export class HubVersionDetailDialogComponent {
  data = inject<HubVersionDetailDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<HubVersionDetailDialogComponent, HubVersionDetailDialogResult>);
  readonly isDraftVersion = isDraftVersion;
  readonly versionStatusLabel = versionStatusLabel;

  save() {
    this.dialogRef.close({
      startingDate: this.data.startingDate,
      expiryDate: this.data.expiryDate,
    });
  }
}
