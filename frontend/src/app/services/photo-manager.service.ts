import { Injectable } from '@angular/core';
import { PhotoIndexedDbService } from './photo-of-indexedDB.service';
import { PhotoApiService } from './photo-api.service';
import { firstValueFrom } from 'rxjs';
import { MockPhotoService } from './mock-photo.service';
import { AppModeService } from './app-mode.service';
import { Photo } from '../models/photo-interfaces';
import { PhotoSyncService } from './photo-sync.service';
import { PhotoBuilderService } from './photo-builder.service';
import { PhotoDataService } from './photo-data.service';
import { PhotoStateService } from './photo-state.service';
import { ConfirmDialogService } from './confirm-dialog.service';


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
    private dataService: PhotoDataService,
    private storage: PhotoIndexedDbService,
    private api: PhotoApiService,
    private mockPhotoService: MockPhotoService,
    private photoSyncService: PhotoSyncService,
    private photoBuilder: PhotoBuilderService,
    private appModeService: AppModeService,
    private confirmDialogService: ConfirmDialogService,
    private state: PhotoStateService) { }


  async getAllPhotos(): Promise<Photo[]> {
    console.log('PhotoManagerService: getAllPhotos called');
    if (this.appModeService.isDemo())
      return this.mockPhotoService.getMockPhotos();
    else
      return this.storage.getAllPhotos();
  }

  async loadPhotosToState(): Promise<void> {
    const photos = await this.getAllPhotos();
    this.state.setPhotos(photos);
  }

  private async findOrphanedPhotosInState(): Promise<Photo[]> {
    if (this.appModeService.isDemo()) {
      console.log('findOrphanedPhotosInState: дэма-рэжым, сінхранізацыя не патрэбна');
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
    return this.confirmDialogService.show(
      'Некаторыя фота ёсць толькі ў лакальнай базе і не сінхранізаваныя. Сінхранізаваць іх цяпер?'
    );
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
        console.log('Карыстальнік адмяніў сінхранізацыю.');
        // Фота ўжо пазначаныя несінхранізаванымі і даступныя для прагляду.
        return this.state.getPhotosSnapshot();
      }
    }
    else {
      console.log("PhotoManagerService: Сінхранізацыя не патрэбная");
      return this.state.getPhotosSnapshot();
    }

    await this.syncWithServer();
    const photosAfterSync = await this.getAllPhotos();
    this.state.setPhotos(photosAfterSync);
    return photosAfterSync;
  }

  async addNewPhotoFromFile(file: File): Promise<Photo> {
    const photo = await this.dataService.addNew(file);
    await this.syncWithServer({ syncNew: true, syncUpdated: false, syncDeleted: false });
    return photo;
  }

  async updatePhoto(id: number | string, newTitle: string, newDescription: string): Promise<void> {
    await this.dataService.updatePhoto(id, newTitle, newDescription);
    await this.syncWithServer({ syncNew: false, syncUpdated: true, syncDeleted: false });
  }

  async deletePhoto(photo: Photo): Promise<void> {
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
        console.warn('⚠️ PhotoManagerService: Photo without id received from server, skipping', sp);
        continue;
      }
      const exists = await this.storage.photoExists(sp.id);
      if (exists) {
        console.log(`ℹ️ PhotoManagerService: Photo with id=${sp.id} already exists in IndexedDB, skipping`);
        continue;
      }
      const file = await this.api.downloadPhotoFile(sp.id);
      const photoToStore = this.photoBuilder.buildPhotoToStoreFromServer(sp, file);
      await this.storage.savePhotoWithId(sp.id, photoToStore); // 💡 гл. ніжэй
    }

    console.log('✅ PhotoManagerService: Photos from server loaded into IndexedDB');
  }


  async syncWithServer(options: SyncOptions = {}): Promise<void> {
    const photos = await this.storage.getPhotosForSync();
    console.log('PhotoManagerService: Photos for sync:', photos);

    if (!photos || photos.length === 0) {
      console.log('PhotoManagerService: няма фота для сінхранізацыі, прапускаем.');
      return;
    }

    console.log('🔄 PhotoManagerService: запускаем сінхранізацыю праз PhotoSyncService');
    await this.photoSyncService.syncWithServer(options);
    const photosFromIndexedDB = await this.getAllPhotos();
    this.state.setPhotos(photosFromIndexedDB);
  }





  async clearLocalStorage(): Promise<void> {
    await this.storage.clearAllPhotos();
    this.state.setPhotos([]);
  }

}
