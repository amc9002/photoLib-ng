import { Component, OnInit, OnDestroy } from '@angular/core';
import { HomeComponent } from './pages/home/home.component';
import { PhotoService } from './services/photo.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogService } from './shared/confirm-dialog/confirm-dialog.service';
import { Photo } from './models/photo';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';
import { Observable } from 'rxjs';
import { SpinnerComponent } from './shared/spinner/spinner.component';
import { PhotoDataService } from './services/photo-data.service';
import { PhotoUtilsService } from './services/photo-utils.service';
import { PhotoToStore } from './services/photo-of-indexedDB.service';
import { Subscription } from 'rxjs';
import { AppModeService } from './services/app-mode.service';

@Component({
  selector: 'app-root',
  standalone: true, // ✅ standalone кампанент
  imports: [
    HomeComponent,
    SpinnerComponent,
    ConfirmDialogComponent,
    CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'photolib-ng';
  loading$: Observable<boolean>;
  photos$!: Observable<Photo[]>;

  private subscriptions = new Subscription();

  photos: Photo[] = [];

  selectedPhoto: Photo | null = null;

  constructor(
    private loadingService: LoadingService,
    private confirmDialogService: ConfirmDialogService,
    private photoService: PhotoService,
    private photoDataService: PhotoDataService,
    private appModeService: AppModeService,
    private photoUtils: PhotoUtilsService
  ) {
    this.loading$ = this.loadingService.loading$;
    this.photoService.photos$.subscribe(p => {
      this.photos = p ?? [];
    });
  }

  onPhotoSelected(photo: Photo) {
    this.selectedPhoto = photo;
  }

  async loadPhotos() {
    this.photos = await this.photoDataService.getAllPhotos();
    this.photoService.setPhotos(this.photos); // Абнаўляем сэрвіс фота, калі трэба
  }

  async reloadPhotosFromServer() {
    await this.clearPhotosStorage();
    await this.photoDataService.loadPhotosFromServerToLocalDB();
    const photos = await this.photoDataService.getAllPhotos();
    this.photos = photos;
  }

  ngOnInit(): void {
    this.syncUnsyncedPhotosOnStartup();
    const modeSub = this.appModeService.mode$.subscribe(() => {
      console.log('AppComponent: App mode changed, reloading photos');
      this.loadPhotos();
    });
    this.subscriptions.add(modeSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onSyncRequested() {
    console.log("📡 AppComponent: Сінхранізацыя запрошана з toolbar");
    this.photoDataService.syncWithServer();
  }

  private async syncUnsyncedPhotosOnStartup() {
    console.log("🟡 AppComponent: syncUnsyncedPhotosOnStartup() called");
    const allPhotos = await this.photoDataService.getAllPhotos();

    const unsynced = allPhotos.filter(p => !p.isSynced);
    if (unsynced.length === 0) {
      console.log("✅ AppComponent:  Усе фоткі сінхранізаваныя");
      return;
    }

    console.log(`🔄 AppComponent: Знойдзена ${unsynced.length} не сінхранізаваных фотак. Сінхранізую...`);

    for (const photo of unsynced) {
      await this.photoDataService.uploadPhotoToServer(photo);
    }

    // Пасля сінхранізацыі абнавіць фота ў сэрвісе
    const updatedPhotos = await this.photoDataService.getAllPhotos();
    this.photoService.setPhotos(updatedPhotos);
  }

  onEditDescription() {
    console.log("AppComponent: Edit description dialog called");
  }

  onUploadPhoto(file: File) {
    const url = this.photoUtils.fileToSafeUrl(file);
    console.log('AppComponent: Starting upload photo...');

    const tempId = 'temp' + Date.now();
    const newPhoto: Photo = {
      id: tempId, // Унікальны ID на падставе часу
      fileName: file.name,
      description: '',
      file: file,     // Калі патрэбна захоўваць файл
      url: url,        // 👈 Дадаем url для адлюстравання
      isSynced: false,
      isModified: false
    };
    this.photos.push(newPhoto);
    const photoToStore: PhotoToStore = {
      file: file,
      fileName: file.name,
      description: '',
      isSynced: false
    };
    this.photoDataService.savePhoto(photoToStore).then(() => {
      console.log('🟡 AppComponent: Photo saved locally (not synced)');
      this.photoDataService.getAllPhotos().then((photos) => {
        console.log('📦 AppComponent: All photos from storage:', photos);
        this.photoService.setPhotos(photos);
      });
    });
  }

  onDeletePhoto() {
    console.log("AppComponent: Deleting of photo", this.selectedPhoto);
    if (!this.selectedPhoto) return;

    this.confirmDialogService.show(
      'Are you sure you want to delete this photo?',
      () => {
        this.photoService.deletePhoto(this.selectedPhoto!);
        this.photoDataService.deletePhoto(this.selectedPhoto!)
          .then(() => console.log('🗑️ AppComponent: Фота таксама выдалена з IndexedDB'));
        this.selectedPhoto = null;
        console.log("AppComponent: Фота выдалена");
      },
      () => {
        console.log("AppComponent: Выдаленьне адменена");
      }
    );
  }

  async clearPhotosStorage() {
    await this.photoDataService.clearLocalStorage();
    this.photos = [];
    console.log('🧹 AppComponent: Photos cleared from local IndexedDB and memory');
  }
}
