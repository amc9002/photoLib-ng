import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-photo-actions',
  standalone: true,
  imports: [],
  templateUrl: './photo-actions.component.html',
  styleUrl: './photo-actions.component.scss'
})
export class PhotoActionsComponent {
  @Output() editDescription = new EventEmitter<void>();
  @Output() uploadPhoto = new EventEmitter<void>();
  @Output() deletePhoto = new EventEmitter<void>();

  onEditClick() {
    this.editDescription.emit();
  }

  onUploadClick() {
    this.uploadPhoto.emit();
  }

  onDeleteClick() {
    this.deletePhoto.emit();
  }
}
