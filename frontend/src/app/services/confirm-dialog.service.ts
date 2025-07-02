import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  isVisible = false;
  message = '';

  private resolve!: (value: boolean) => void;

  show(message: string): Promise<boolean> {
    this.message = message;
    this.isVisible = true;

    return new Promise<boolean>((resolve) => {
      this.resolve = resolve;
    });
  }

  confirm() {
    this.isVisible = false;
    this.resolve(true);
  }

  cancel() {
    this.isVisible = false;
    this.resolve(false);
  }
}
