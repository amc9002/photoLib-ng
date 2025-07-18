import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './pages/home/home.component';
import { ConfirmDialogService } from './services/utilServices/confirm-dialog.service';
import { Photo } from './models/photo-interfaces';
import { LoadingService } from './services/utilServices/loading.service';
import { Observable, Subscription, Subject, takeUntil, tap } from 'rxjs';
import { SpinnerComponent } from './shared/spinner/spinner.component';
import { PhotoManagerService } from './services/photoServices/photo-manager.service';
import { SafeUrl } from '@angular/platform-browser';
import { EditPhotoDialogComponent } from './shared/edit-photo-dialog/edit-photo-dialog.component';
import { PhotoStateService } from './services/stateServices/photo-state.service';
import { MatDialogModule } from '@angular/material/dialog';
import { ManagerService } from './services/manager.service';
import { Gallery } from './models/gallery-interfaces';
import { LoggerService } from './services/logger.service';

@Component({
  selector: 'app-root',
  standalone: true, // ✅ standalone кампанент
  imports: [
    HomeComponent,
    SpinnerComponent,
    EditPhotoDialogComponent,
    MatDialogModule,
    CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  title = 'photolib-ng';
  loading$: Observable<boolean>;
  photos$!: Observable<Photo[]>;
  private destroy$ = new Subject<void>();

  private subscriptions = new Subscription();

  photos: (Photo & { url: SafeUrl })[] = [];

  exifData: any = null;

  selectedPhoto: Photo | null = null;

  constructor(
    private logger: LoggerService,
    private loadingService: LoadingService,
    private confirmDialogService: ConfirmDialogService,
    private managerService: ManagerService,
    private photoManagerService: PhotoManagerService,
    private state: PhotoStateService,

  ) {
    this.loading$ = this.loadingService.loading$;

    this.managerService.getPhotosForSelectedGallery()
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => {
        console.log('📥 AppComponent (raw subscribe): photos from managerService:', p);
        this.photos = p ?? [];
      });

    // this.photos$ = this.managerService.getPhotosForSelectedGallery().pipe(
    //   tap(p => {
    //     this.logger.log('--s', '📥 AppComponent: photos from managerService:', p);
    //     this.photos = p ?? [];
    //   }),
    //   takeUntil(this.destroy$)
    // );


    (window as any).state = this.state;
  }



  selectedGallery: Gallery | null = null;

  onGallerySelected(gallery: Gallery) {
    this.logger.log('--h', 'AppComponent: Галерэя выбрана:', gallery);
    this.selectedGallery = gallery;
    this.managerService.selectGallery(gallery);
  }

  onPhotoSelected(photo: Photo) {
    this.logger.log('--h', "📸 Selected photo =", photo);
    this.logger.log('--h', "📦 file =", photo.file);
    this.selectedPhoto = photo;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe(); // калі ты яго выкарыстоўваў
  }

  async onSyncRequested() {
    this.logger.log('--h', "📡 AppComponent: Сінхранізацыя запрошана з toolbar");
    await this.managerService.sync();
  }



  async addNewGallery() {
    const newGallery = {
      name: 'Новая галерэя',
      description: 'Апісанне новай галерэі',
    };
    await this.managerService.addGallery(newGallery);
    this.logger.log('--h', 'AppComponent: Галерэя дададзена');
  }

  async updateSelectedGallery() {
    if (!this.selectedGallery) return;
    await this.managerService.updateGallery(this.selectedGallery.id, {
      name: 'Абноўленая назва',
    });
    this.logger.log('--h', 'AppComponent: Галерэя абноўлена');
  }

  async deleteSelectedGallery() {
    if (!this.selectedGallery) return;
    await this.managerService.deleteGallery(this.selectedGallery.id);
    this.selectedGallery = null;
    this.logger.log('--h', 'AppComponent: Галерэя выдалена');
  }

  async loadGalleries() {
    const galleries = await this.managerService.getGalleries();
    this.logger.log('--h', 'AppComponent: Загружаныя галерэі:', galleries);
  }




  editDialogVisible = false;

  onEdit() {
    this.logger.log('--h', "AppComponent: Edit Edit requested");
    this.editDialogVisible = true;
  }

  onCancelEdit() {
    this.logger.log('--h', "AppComponent: Edit cancelled");
    this.editDialogVisible = false;
  }

  async onSaveEdit(data: { title: string, description: string }) {
    if (!this.selectedPhoto) return;
    await this.managerService.updatePhoto(this.selectedPhoto.id!, data.title, data.description);
    this.editDialogVisible = false;
  }

  async onUploadPhoto(file: File, galleryId: number) {
    this.logger.log('--h', "AppComponent: Upload requested", { file, galleryId });
    if (!galleryId) {
      this.logger.warn('--s', "Gallery ID is empty or invalid. Please select a gallery before uploading.");
      return;
    }
    await this.managerService.addPhoto(file, galleryId);
  }

  async onDeletePhoto() {
    if (!this.selectedPhoto) return;
    const confirmed = await this.confirmDialogService.show('Are you sure?');
    if (confirmed) {
      await this.managerService.deletePhoto(this.selectedPhoto);
      this.selectedPhoto = null;
    }
  }

  async clearPhotosStorage() {
    await this.photoManagerService.clearLocalStorage();
    this.state.setPhotos([]);
    this.logger.log('--h', '🧹 AppComponent: Photos cleared from local IndexedDB and memory');
  }
}
