import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Photo } from '../../models/photo-interfaces';

@Component({
  selector: 'app-edit-photo-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-photo-dialog.component.html',
  styleUrl: './edit-photo-dialog.component.scss'
})
export class EditPhotoDialogComponent {
  @Input() photo: Photo | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ title: string, description: string }>();
  // @Input() title: string = '';
  // @Input() description: string = '';
  
  title: string = '';
  description: string = '';

  ngOnChanges() {
    if (this.photo) {
      this.title = this.photo.title ?? '';
      this.description = this.photo.description ?? '';
    }
  }

  onSave() {
    this.save.emit({ title: this.title, description: this.description });
  }

  onCancel() {
    this.cancel.emit();
  }
}
