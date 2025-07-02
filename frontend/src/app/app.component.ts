import { Component, OnInit, OnDestroy } from '@angular/core';
import { HomeComponent } from './pages/home/home.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogService } from './services/confirm-dialog.service';
import { Photo } from './models/photo-interfaces';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';
import { Observable } from 'rxjs';
import { SpinnerComponent } from './shared/spinner/spinner.component';
import { PhotoManagerService } from './services/photo-manager.service';
import { PhotoUtilsService } from './services/photo-utils.service';
import { PhotoIndexedDbService } from './services/photo-of-indexedDB.service';
import { Subscription } from 'rxjs';
import { AppModeService } from './services/app-mode.service';
import { SafeUrl } from '@angular/platform-browser';
import { EditPhotoDialogComponent } from './shared/edit-photo-dialog/edit-photo-dialog.component';
import { MockPhotoService } from './services/mock-photo.service';
import { AppMode } from './shared/app-mode.enum';
import { PhotoStateService } from './services/photo-state.service';

@Component({
  selector: 'app-root',
  standalone: true, // ✅ standalone кампанент
  imports: [
    HomeComponent,
    SpinnerComponent,
    ConfirmDialogComponent,
    EditPhotoDialogComponent,
    CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'photolib-ng';
  loading$: Observable<boolean>;
  photos$!: Observable<Photo[]>;

  private subscriptions = new Subscription();

  photos: (Photo & { url: SafeUrl })[] = [];
  // photosWithUrl: PhotoWithUrl[] = [];
  exifData: any = null;

  selectedPhoto: Photo | null = null;

  constructor(
    private loadingService: LoadingService,
    private confirmDialogService: ConfirmDialogService,
    private photoManagerService: PhotoManagerService,
    private appModeService: AppModeService,
    private photoUtils: PhotoUtilsService,
    private indexedDbService: PhotoIndexedDbService,
    private mockPhotoService: MockPhotoService,
    private state: PhotoStateService
  ) {
    this.loading$ = this.loadingService.loading$;
    this.state.photos$.subscribe(p => {
      this.photos = p ?? [];
    });
  }

  onPhotoSelected(photo: Photo) {
    console.log("📸 Selected photo =", photo);
    console.log("📦 file =", photo.file);
    this.selectedPhoto = photo;
  }

  private async loadPhotosDependingOnMode() {
    const mode = this.appModeService.getMode();

    if (mode === AppMode.Demo) {
      console.log('AppComponent: Loading mock photos');
      const mockPhotos = this.mockPhotoService.getMockPhotos();
      const photosWithUrls = this.photoUtils.addUrlToPhotos(mockPhotos, []);
      this.state.setPhotos(photosWithUrls);
    } else {
      console.log('AppComponent: Loading real photos');
      const realPhotos = await this.photoManagerService.getAllPhotos();
      const photosWithUrls = this.photoUtils.addUrlToPhotos(realPhotos, []);
      this.state.setPhotos(photosWithUrls);
    }
  }


  async ngOnInit(): Promise<void> {
    await this.indexedDbService.initDB(); // 🟢 1. Спачатку — адкрыць IndexedDB

    // 2. Загружаем фоткі з IndexedDB у state (PhotoStateService праз PhotoManagerService)
    const photosFromIndexedDB = await this.photoManagerService.getAllPhotos();
    this.state.setPhotos(photosFromIndexedDB); // усталёўваем у BehaviorSubject у PhotoService або State

    // 3. Сінхранізуем несінхранізаваныя фоткі з серверам (upload/download)
    await this.photoManagerService.syncUnsyncedPhotosOnStartup();

    // 4. Пасля сінхранізацыі — абнавіць state з актуальнымі фоткамі
    const photosAfterSync = await this.photoManagerService.getAllPhotos();
    this.state.setPhotos(photosAfterSync);

    // 5. Падпісацца на змены рэжыму прыкладання (напрыклад, Demo/Real)
    const modeSubscription = this.appModeService.mode$.subscribe(mode => {
      console.log('AppComponent: Рэжым прыкладання змяніўся:', mode);
      this.loadPhotosDependingOnMode(); // метад, які загружае фоткі ў залежнасці ад рэжыму
    });
    this.subscriptions.add(modeSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async onSyncRequested() {
    console.log("📡 AppComponent: Сінхранізацыя запрошана з toolbar");
    await this.photoManagerService.syncWithServer({});
  }


  editDialogVisible = false;

  onEdit() {
    console.log("AppComponent: Edit Edit requested");
    this.editDialogVisible = true;
  }

  onCancelEdit() {
    console.log("AppComponent: Edit cancelled");
    this.editDialogVisible = false;
  }

  async onSaveEdit(data: { title: string, description: string }) {
    const selectedPhoto = this.selectedPhoto;
    if (!selectedPhoto || selectedPhoto.id === undefined) {
      console.error('Немагчыма абнавіць фота без id');
      return;
    }
    console.log("AppComponent: Saving edited data", data);
    await this.photoManagerService.updatePhoto(selectedPhoto.id, data.title, data.description);

    const updatedPhotos = await this.photoManagerService.getAllPhotos();
    this.state.setPhotos(updatedPhotos);
    const updatedSelected = updatedPhotos.find(p => p.id === selectedPhoto.id);
    if (updatedSelected) {
      this.selectedPhoto = updatedSelected;
    }

    this.editDialogVisible = false;
  }


  async onUploadPhoto(file: File) {
    console.log("AppComponent: Upload requested");
    await this.photoManagerService.addNewPhotoFromFile(file);
  }


  async onDeletePhoto() {
    console.log("AppComponent: Deleting of photo", this.selectedPhoto);
    if (!this.selectedPhoto) return;

    const confirmed = await this.confirmDialogService.show('Are you sure you want to delete this photo?');

    if (confirmed) {
      await this.photoManagerService.deletePhoto(this.selectedPhoto!);
      this.selectedPhoto = null;
    } else {
      console.log("AppComponent: Выдаленьне адменена");
    }
  }


  async clearPhotosStorage() {
    await this.photoManagerService.clearLocalStorage();
    this.state.setPhotos([]);
    console.log('🧹 AppComponent: Photos cleared from local IndexedDB and memory');
  }
}
