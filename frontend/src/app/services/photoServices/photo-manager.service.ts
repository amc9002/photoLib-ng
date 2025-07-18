import { Injectable } from '@angular/core';
import { PhotoIndexedDbService } from '../indexedDbServices/photo-indexedDB.service';
import { PhotoApiService } from '../apiServices/photo-api.service';
import { firstValueFrom } from 'rxjs';
import { MockPhotoService } from '../utilServices/mock-photo.service';
import { AppModeService } from '../utilServices/app-mode.service';
import { Photo } from '../../models/photo-interfaces';
import { PhotoSyncService } from '../syncServices/photo-sync.service';
import { PhotoBuilderService } from './photo-builder.service';
import { PhotoDataService } from './photo-data.service';
import { PhotoStateService } from '../stateServices/photo-state.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { GalleryManagerService } from '../galleryServices/gallery-manager.service';
import { PhotoUtilsService } from './photo-utils.service';
import { LoggerService } from '../logger.service';
import { STORE_NAMES } from '../../config/db-config';


interface SyncOptions {
  fullReconcile?: boolean;
  syncNew?: boolean;
  syncUpdated?: boolean;
  syncDeleted?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoManagerService {

  constructor(
    private logger: LoggerService,
    private photoDb: PhotoIndexedDbService,
    private photoState: PhotoStateService,
    private dataService: PhotoDataService,
    private photoUtils: PhotoUtilsService,
    private galleryService: GalleryManagerService,
    private storage: PhotoIndexedDbService,
    private api: PhotoApiService,
    private mockPhotoService: MockPhotoService,
    private photoSyncService: PhotoSyncService,
    private photoBuilder: PhotoBuilderService,
    private appModeService: AppModeService,
    private dialog: MatDialog,
    private state: PhotoStateService) { }


  defineObjectStore(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains(STORE_NAMES.PHOTOS)) {
      db.createObjectStore(STORE_NAMES.PHOTOS, { keyPath: 'id', autoIncrement: true });
      this.logger.log('--h', `📸 PhotoManagerService: Created store ${STORE_NAMES.PHOTOS}`);
    }
  }

  setDbInstance(db: IDBDatabase): void {
    this.photoDb.setDb(db);
  }

  async loadInitialData(): Promise<void> {
    this.logger.log('--h', '📸 PhotoManagerService: loading photos from IndexedDB...');
    const photos = await this.photoDb.getAllPhotos();
    this.logger.log('--h', `📸 PhotoManagerService: loaded ${photos.length} photos`);
    this.photoState.setPhotos(photos);
  }



  async getAllPhotos(): Promise<Photo[]> {
    this.logger.log('--h', 'PhotoManagerService: getAllPhotos called');
    if (this.appModeService.isDemo())
      return this.mockPhotoService.getMockPhotos();
    else
      return this.storage.getAllPhotos();
  }

  /*Службовы мэтад для чытаньня фотак з IndexedDB (не для UI)*/
  async getPhotosFromStorageForSelectedGallery(): Promise<Photo[]> {
    const selectedGalleryId = this.galleryService.getSelectedGalleryId();
    this.logger.log('--s', 'PhotoManagerService.getPhotosForSelectedGallery: выцягваем фоткі з галерэі з id: ', selectedGalleryId);
    if (!selectedGalleryId) return [];

    const photos = await this.storage.getPhotosByGalleryId(selectedGalleryId);
    return photos;
  }


  async loadPhotosToState(): Promise<void> {
    const photos = await this.getAllPhotos();
    this.state.setPhotos(photos);
  }

  async loadPhotosDependingOnMode(): Promise<void> {
    if (this.appModeService.isDemo()) {
      this.logger.log('--s', 'PhotoManagerService: Loading mock photos');
      const mockPhotos = this.mockPhotoService.getMockPhotos();
      const photosWithUrls = this.photoUtils.addUrlToPhotos(mockPhotos, []);
      this.state.setPhotos(photosWithUrls);
    } else {
      this.logger.log('--h', 'PhotoManagerService: Loading real photos');
      const realPhotos = await this.getAllPhotos();
      const photosWithUrls = this.photoUtils.addUrlToPhotos(realPhotos, []);
      this.state.setPhotos(photosWithUrls);
    }
  }


  private async findOrphanedPhotosInState(): Promise<Photo[]> {
    if (this.appModeService.isDemo()) {
      this.logger.log('--s', 'findOrphanedPhotosInState: дэма-рэжым, сінхранізацыя не патрэбна');
      return [];
    }

    const localPhotos = await this.storage.getAllPhotos();
    this.state.setPhotos(localPhotos);

    const serverPhotos = await firstValueFrom(this.api.getPhotos());
    const serverIds = new Set(serverPhotos.map(p => p.id));

    const orphaned = localPhotos.filter(p => !serverIds.has(p.id) && !p.isDeleted);

    return orphaned;
  }

  async markOrphanedPhotosUnsynced(orphaned: Photo[]): Promise<void> {
    for (const photo of orphaned) {
      photo.isSynced = false;
      photo.isModified = true;
      await this.storage.updatePhoto(photo);
    }
    await this.loadPhotosToState();
  }


  async findAndMarkOrphaned(): Promise<Photo[]> {
    const orphaned = await this.findOrphanedPhotosInState();
    if (orphaned.length > 0) {
      await this.markOrphanedPhotosUnsynced(orphaned);
    }
    return orphaned;
  }

  async confirmOrphanedSync(): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Некаторыя фота толькі ў лакальнай базе. Сінхранізаваць іх цяпер?' }
    });

    return await firstValueFrom(dialogRef.afterClosed());
  }


  async syncUnsyncedPhotosOnStartup(): Promise<Photo[]> {
    if (this.appModeService.isDemo()) {
      const mockPhotos = this.mockPhotoService.getMockPhotos();
      this.state.setPhotos(mockPhotos);
      return mockPhotos;
    }

    const orphaned = await this.findAndMarkOrphaned();
    if (orphaned.length > 0) {
      const userConfirmed = await this.confirmOrphanedSync();
      if (!userConfirmed) {
        this.logger.log('--h', 'Карыстальнік адмяніў сінхранізацыю.');
        // Фота ўжо пазначаныя несінхранізаванымі і даступныя для прагляду.
        return this.state.getPhotosSnapshot();
      }
    }
    else {
      this.logger.log('--s', "PhotoManagerService: Сінхранізацыя не патрэбная");
      return this.state.getPhotosSnapshot();
    }

    await this.syncWithServer();
    const photosAfterSync = await this.getAllPhotos();
    this.state.setPhotos(photosAfterSync);
    return photosAfterSync;
  }

  async addPhoto(file: File, galleryId: number): Promise<Photo> {
    this.logger.log('--h', 'PhotoManagerService.addPhoto: Атрымаў galleryId =', galleryId);
    const allFromDb = await this.storage.getAllPhotos();
    this.logger.log('--h', '[DEBUG] PhotoManagerService: All photos in IndexedDB before sync:', allFromDb);

    const photo = await this.dataService.addNew(file, galleryId);
    this.logger.log('--h', 'PhotoManagerService.addPhoto: Атрыманая фотка з galleryId =', photo.galleryId);

    this.logger.log('--h', '[DEBUG] PhotoManagerService.addPhoto: returned Photo =', {
      id: photo.id,
      galleryId: photo.galleryId,
      isSynced: photo.isSynced
    });

    this.state.addPhoto(photo);

    this.logger.log('--h', '📤 PhotoManagerService: Uploading photo:', {
      galleryId: photo.galleryId,
      photo
    });
    await this.syncWithServer({ syncNew: true, syncUpdated: false, syncDeleted: false });
    return photo;
  }

  async updatePhoto(id: number, newTitle: string, newDescription: string): Promise<void> {
    await this.dataService.updatePhoto(id, newTitle, newDescription);
    await this.syncWithServer({ syncNew: false, syncUpdated: true, syncDeleted: false });
  }

  async deletePhoto(photo: Photo): Promise<void> {
    this.logger.log('--h', 'PhotoManagerService: deletePhoto called', photo.id, photo.isDeleted);
    await this.dataService.deletePhoto(photo);
    await this.syncWithServer({ syncNew: false, syncUpdated: false, syncDeleted: true });
  }


  async reloadPhotosFromServer(): Promise<void> {
    await this.clearLocalStorage(); // ачыстка IndexedDB
    await this.loadPhotosFromServerToLocalDB(); // загрузка з сервера ў IndexedDB

    // Атрымаць фоткі з IndexedDB пасля загрузкі
    const photos = await this.getAllPhotos();

    // Абнавіць стэйт (напрыклад, праз PhotoStateService)
    this.state.setPhotos(photos);
  }


  async loadPhotosFromServerToLocalDB() {
    const serverPhotos = await firstValueFrom(this.api.getPhotos());

    for (const sp of serverPhotos) {
      if (sp.id === undefined) {
        this.logger.warn('--h', '⚠️ PhotoManagerService: Photo without id received from server, skipping', sp);
        continue;
      }
      const exists = await this.storage.photoExists(sp.id);
      if (exists) {
        this.logger.log('--h', `ℹ️ PhotoManagerService: Photo with id=${sp.id} already exists in IndexedDB, skipping`);
        continue;
      }
      const file = await this.api.downloadPhotoFile(sp.id);
      const photoToStore = this.photoBuilder.buildPhotoToStoreFromServer(sp, file);
      await this.storage.savePhotoWithId(sp.id, photoToStore); // 💡 гл. ніжэй
    }

    this.logger.log('--h', '✅ PhotoManagerService: Photos from server loaded into IndexedDB');
  }


  async syncWithServer(options: SyncOptions = {}): Promise<void> {
    const photos = await this.storage.getPhotosForSync();
    this.logger.log('--h', 'PhotoManagerService: Photos for sync:', photos);

    if (!photos || photos.length === 0) {
      this.logger.log('--h', 'PhotoManagerService: няма фота для сінхранізацыі, прапускаем.');
      return;
    }

    this.logger.log('--h', '🔄 PhotoManagerService: запускаем сінхранізацыю праз PhotoSyncService');
    await this.photoSyncService.syncWithServer(options);
    const photosFromIndexedDB = await this.getAllPhotos();
    this.state.setPhotos(photosFromIndexedDB);
  }

  async clearLocalStorage(): Promise<void> {
    await this.storage.deleteAllPhotos();
    this.state.setPhotos([]);
  }

}
