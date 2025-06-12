import { Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  isVisible = false;
  message = '';
  onConfirm: () => void = () => {};
  onCancel: () => void = () => {};

  show(message: string, onConfirm: () => void, onCancel: () => void) {
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.isVisible = true;
  }

  confirm() {
    this.onConfirm();
    this.isVisible = false;
  }

  cancel() {
    this.onCancel();
    this.isVisible = false;
  }
}
