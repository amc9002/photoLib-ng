import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../../models/photo';
import { PhotoDescriptionComponent } from './photo-description/photo-description.component';
import { PhotoMetadataComponent } from './photo-metadata/photo-metadata.component';
import { PhotoActionsComponent } from './photo-actions/photo-actions.component';

@Component({
  selector: 'app-photo-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    PhotoDescriptionComponent,
    PhotoMetadataComponent,
    PhotoActionsComponent,
  ],
  templateUrl: './photo-sidebar.component.html',
  styleUrls: ['./photo-sidebar.component.scss']
})
export class PhotoSidebarComponent {
  @Input() photo: Photo | null = null;
  @Output() exifExtracted = new EventEmitter<any>();
  @Output() deletePhoto = new EventEmitter<void>();
  @Output() editDescription = new EventEmitter<void>();
  @Output() uploadPhoto = new EventEmitter<Photo>();

  isEditingDescription = false;

  onExifExtracted(exif: any) {
    this.exifExtracted.emit(exif);
  }

  onEditDescription() {
    this.isEditingDescription = true;
  }

  onDescriptionSaved(newDescription: string) {
    if (this.photo) {
      this.photo.description = newDescription;
    }
    this.isEditingDescription = false;
  }

  onCancelEditing() {
  this.isEditingDescription = false;
}

  onUploadPhoto() {
    console.log('Націснута: Загрузіць фота');
    this.uploadPhoto.emit();
  }

  onDeletePhoto() {
    console.log("Націснута: выдаліць фота");
    this.deletePhoto.emit();
  }
}
