import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryComponent } from './gallery/gallery.component';
import { PhotoViewerComponent } from './photo-viewer/photo-viewer.component';
import { PhotoSidebarComponent } from './photo-sidebar/photo-sidebar.component';
import { MapComponent } from './map/map.component';
import { Photo, PhotoWithUrl } from '../../models/photo-interfaces';
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
  @Input() photos: PhotoWithUrl[] = [];;
  @Input() selectedPhoto: Photo | null = null;
  @Output() photoSelected = new EventEmitter<Photo>();
  @Output() editPhoto = new EventEmitter<{title: string, description: string}>();
  @Output() uploadPhoto = new EventEmitter<File>();
  @Output() deletePhoto = new EventEmitter<void>();
  @Output() syncRequested = new EventEmitter<void>();
  @Output() exifExtracted = new EventEmitter<any>();

  constructor(private cdr: ChangeDetectorRef) {}

  exifData: any = null;

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
    this.cdr.detectChanges();
    this.exifExtracted.emit(exif);
    
  }

  onEditPhoto(details: {title: string, description: string}) {
    console.log("HomeComponent: The description will be edited");
    this.editPhoto.emit(details);
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