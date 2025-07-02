import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../../models/photo-interfaces';
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
  @Output() requestDelete = new EventEmitter<void>();
  @Output() requestEdit = new EventEmitter<{ title: string, description: string }>();
  @Output() uploadPhoto = new EventEmitter<File>();
  // @Output() descriptionUpdated = new EventEmitter<string>();
  // @Output() titleUpdated = new EventEmitter<string>();

  isEditingDescription = false;

  onExifExtracted(exif: any) {
    console.log('🧩 SidebarComponent: photo =', this.photo);
    console.log('PhotoSidebarComponent: EXIF extracted', exif);
    this.exifExtracted.emit(exif);
  }

  onEditDetails() {
    if (!this.photo) return;
    this.requestEdit.emit({
      title: this.photo?.title ?? '',
      description: this.photo?.description ?? ''
    });
  }

  // onDescriptionSaved(newDescription: string) {
  //   if (this.photo) {
  //     this.photo.description = newDescription;
  //   }
  //   this.isEditingDescription = false;
  // }

  // onCancelEditing() {
  //   this.isEditingDescription = false;
  // }

  onUploadPhoto(file: File) {
    this.uploadPhoto.emit(file);
  }


  onDeletePhoto() {
    this.requestDelete.emit();
  }
}
