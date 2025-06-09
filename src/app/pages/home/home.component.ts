import { Component } from '@angular/core';
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
  selectedImage: Photo | null = null;

  onPhotoSelected(photo: Photo) {
    this.selectedImage = photo;
  }

  exifData: any = {
  GPSLatitude: 52.2297,
  GPSLongitude: 21.0122
};

onExifExtracted(exif: any) {
  console.log('EXIF received in HomeComponent:', exif);
  this.exifData = exif;
}
}