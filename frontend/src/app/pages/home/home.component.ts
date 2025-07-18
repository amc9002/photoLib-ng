import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryComponent } from './gallery/gallery.component';
import { PhotoViewerComponent } from './photo-viewer/photo-viewer.component';
import { PhotoSidebarComponent } from './photo-sidebar/photo-sidebar.component';
import { MapComponent } from './map/map.component';
import { Photo, PhotoWithUrl } from '../../models/photo-interfaces';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { FormsModule } from '@angular/forms';
import { Gallery } from '../../models/gallery-interfaces';
import { GalleryStateService } from '../../services/stateServices/gallery-state.service';
import { PhotoFilterService } from '../../services/photoFilter/photo-filter.service';
import { Subject, takeUntil } from 'rxjs';
import { LoggerService } from '../../services/logger.service';


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
  @Output() editPhoto = new EventEmitter<{ title: string, description: string }>();
  @Output() uploadPhoto = new EventEmitter<{ file: File, galleryId: number }>();
  @Output() deletePhoto = new EventEmitter<void>();
  @Output() syncRequested = new EventEmitter<void>();
  @Output() exifExtracted = new EventEmitter<any>();
  @Input() selectedGalleryId: number | null = null;
  @Input() selectedGallery: Gallery | null = null;
  @Output() gallerySelected = new EventEmitter<Gallery>();

  filteredPhotos: Photo[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private logger: LoggerService,
    private cdr: ChangeDetectorRef,
    private galleryState: GalleryStateService,
    private photoFilterService: PhotoFilterService
  ) {
    this.photoFilterService.getPhotosForSelectedGallery()
      .pipe(takeUntil(this.destroy$))
      .subscribe(photos => {
        this.filteredPhotos = photos ?? [];
        this.logger.log('--s', 'HomeComponent: 📸 filtered photos updated:', this.filteredPhotos);
      });
  }

  exifData: any = null;

  ngOnInit(): void {
    this.galleryState.selectedGallery$
      .pipe(takeUntil(this.destroy$))
      .subscribe(gallery => {
        this.logger.log('--h','HomeComponent: selectedGallery updated:', gallery);
        this.selectedGallery = gallery;
        this.selectedGalleryId = gallery?.id ?? null;
        this.logger.log('--s','HomeComponent: selectedGallery updated:', this.selectedGallery);
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  onSyncClickedFromToolbar() {
    this.logger.log('--h',"📤 HomeComponent: Перадаю падзею сінхранізацыі ў AppComponent");
    this.syncRequested.emit();
  }

  onGallerySelected(gallery: Gallery) {
    this.logger.log('--s',"🏠 HomeComponent: received gallerySelected =", gallery.name, gallery.id);
    this.selectedGallery = gallery;
    this.selectedGalleryId = gallery.id;
    this.cdr.detectChanges();
  }

  onPhotoSelected(photo: Photo) {
    this.photoSelected.emit(photo);
  }

  onExifExtracted(exif: any) {
    this.logger.log('--h','HomeComponent: EXIF received in HomeComponent:', exif);
    this.exifData = exif;
    this.cdr.detectChanges();
    this.exifExtracted.emit(exif);

  }

  onEditPhoto(details: { title: string, description: string }) {
    this.logger.log('--s',"HomeComponent: The description will be edited");
    this.editPhoto.emit(details);
  }

  onUploadPhoto(file: File) {
    this.logger.log('--s',"HomeComponent: The new photo will be uploaded");
    this.logger.log('--s','📌 Gallery =', this.selectedGallery);

    if (this.selectedGalleryId !== null) {
      this.uploadPhoto.emit({ file, galleryId: this.selectedGalleryId });
    } else {
      this.logger.warn('--s','📛 Нельга загрузіць фота: не выбрана галерэя.');
    }
  }


  onDeletePhoto() {
    this.logger.log('--s',"HomeComponent: The photo will be deleted");
    this.deletePhoto.emit();
  }
}