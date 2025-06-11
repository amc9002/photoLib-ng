import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../../models/photo';
import { PhotoDescriptionComponent } from './photo-description/photo-description.component';
import { PhotoMetadataComponent } from './photo-metadata/photo-metadata.component';
import { PhotoActionsComponent } from './photo-actions/photo-actions.component';
import { PhotoTitleComponent } from "./photo-title/photo-title.component";
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-photo-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    PhotoDescriptionComponent,
    PhotoMetadataComponent,
    PhotoActionsComponent,
    PhotoTitleComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './photo-sidebar.component.html',
  styleUrls: ['./photo-sidebar.component.scss']
})
export class PhotoSidebarComponent {
  @Input() photo: Photo | null = null;
  @Output() exifExtracted = new EventEmitter<any>();
  @Output() deletePhoto = new EventEmitter<void>();

  showConfirmDialog = false;

  onExifExtracted(exif: any) {
    this.exifExtracted.emit(exif);
  }

  onEditDescription() {
    console.log('Націснута: Рэдагаваць апісаньне');
  }

  onUploadPhoto() {
    console.log('Націснута: Загрузіць фота');
  }

  onDeletePhoto() {
    this.showConfirmDialog = true;
  }

  onConfirmDelete() {
    this.deletePhoto.emit();
    this.showConfirmDialog = false;
  }

  onCancelDelete() {
    this.showConfirmDialog = false;
  }
}
