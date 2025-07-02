import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-photo-actions',
  standalone: true,
  imports: [],
  templateUrl: './photo-actions.component.html',
  styleUrl: './photo-actions.component.scss'
})
export class PhotoActionsComponent {
  @Output() editDetails = new EventEmitter<void>();
  @Output() uploadPhoto = new EventEmitter<File>();
  @Output() deletePhoto = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  onEditClick() {
    this.editDetails.emit();
  }

  onUploadClick() {
    this.fileInput.nativeElement.click();
  }

  onDeleteClick() {
    this.deletePhoto.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadPhoto.emit(file);
    }
  }
}
