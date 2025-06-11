import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryComponent } from './gallery/gallery.component';
import { PhotoViewerComponent } from './photo-viewer/photo-viewer.component';
import { PhotoSidebarComponent } from './photo-sidebar/photo-sidebar.component';
import { MapComponent } from './map/map.component';
import { Photo } from '../../models/photo';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,
    GalleryComponent,
    PhotoViewerComponent,
    PhotoSidebarComponent,
    MapComponent],

  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent {
  @Input() selectedPhoto: Photo | null = null;
  @Output() photoSelected = new EventEmitter<Photo>();
  @Output() deletePhoto = new EventEmitter();

  exifData: any = {
    GPSLatitude: 52.2297,
    GPSLongitude: 21.0122
  };

  onPhotoSelected(photo: Photo) {
    this.selectedPhoto = photo;
    this.photoSelected.emit(photo);
  }

  onExifExtracted(exif: any) {
    console.log('EXIF received in HomeComponent:', exif);
    this.exifData = exif;
  }

  onDeletePhoto() {
    console.log("The photo will be deleted");
    this.deletePhoto.emit();
  }
}