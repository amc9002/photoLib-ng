import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component'; // Ваша дарога да кампанента

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {

  constructor(private dialog: MatDialog) { }

  show(message: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '320px',
      panelClass: 'custom-confirm-dialog',
      data: { message }
    });

    return dialogRef.afterClosed().toPromise().then(result => {
      // result будзе true калі пацвердзілі, false калі адмянілі або закрылі
      return !!result;
    });
  }
}
