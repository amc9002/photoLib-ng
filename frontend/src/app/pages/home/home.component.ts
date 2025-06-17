import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryComponent } from './gallery/gallery.component';
import { PhotoViewerComponent } from './photo-viewer/photo-viewer.component';
import { PhotoSidebarComponent } from './photo-sidebar/photo-sidebar.component';
import { MapComponent } from './map/map.component';
import { Photo } from '../../models/photo';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ToolbarComponent,
    GalleryComponent,
    PhotoViewerComponent,
    PhotoSidebarComponent,
    MapComponent],

  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent {
  @Input() photos: Photo[] = [];
  @Input() selectedPhoto: Photo | null = null;
  @Output() photoSelected = new EventEmitter<Photo>();
  @Output() editDescription = new EventEmitter<void>();
  @Output() uploadPhoto = new EventEmitter<File>();
  @Output() deletePhoto = new EventEmitter<void>();
  @Output() syncRequested = new EventEmitter<void>();

  exifData: any = {
    GPSLatitude: 52.2297,
    GPSLongitude: 21.0122
  };

  onSyncClickedFromToolbar() {
    console.log("📤 HomeComponent: Перадаю падзею сінхранізацыі ў AppComponent");
    this.syncRequested.emit();
  }

  onPhotoSelected(photo: Photo) {
    this.photoSelected.emit(photo);
  }

  onExifExtracted(exif: any) {
    console.log('HomeComponent: EXIF received in HomeComponent:', exif);
    this.exifData = exif;
  }

  onEditDescription() {
    console.log("HomeComponent: The description will be edited");
    this.editDescription.emit();
  }

  onUploadPhoto(file: File) {
    console.log("HomeComponent: The new photo will be uploaded");
    this.uploadPhoto.emit(file);
  }

  onDeletePhoto() {
    console.log("HomeComponent: The photo will be deleted");
    this.deletePhoto.emit();
  }
}