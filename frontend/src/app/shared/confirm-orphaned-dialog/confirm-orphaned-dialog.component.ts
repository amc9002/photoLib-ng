import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-orphaned-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './confirm-orphaned-dialog.component.html',
  styleUrls: ['./confirm-orphaned-dialog.component.scss']
})
export class ConfirmOrphanedDialogComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmOrphanedDialogComponent>){}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

}
