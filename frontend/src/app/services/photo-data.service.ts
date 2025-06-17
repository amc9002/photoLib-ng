import { Injectable } from '@angular/core';
import { Photo } from '../models/photo';
import { PhotoIndexedDbService, PhotoToStore } from './photo-of-indexedDB.service';
import { PhotoApiService } from './photo-api.service';
import { firstValueFrom } from 'rxjs';
import { MockPhotoService } from './mock-photo.service';
import { AppModeService } from './app-mode.service';


@Injectable({
  providedIn: 'root'
})
export class PhotoDataService {

  constructor(
    private storage: PhotoIndexedDbService,
    private api: PhotoApiService,
    private mockPhotoService: MockPhotoService,
    private appModeService: AppModeService) { }

  async savePhoto(photo: PhotoToStore): Promise<number> {
    console.log('savePhoto:', photo);
    return this.storage.savePhoto(photo);
  }

  async getAllPhotos(): Promise<Photo[]> {
    console.log('PhotoDataService: getAllPhotos called');
    if (this.appModeService.isDemo())
      return this.mockPhotoService.getMockPhotos();
    else
      return this.storage.getAllPhotos();
  }

  async loadPhotosFromServerToLocalDB() {
    const serverPhotos = await firstValueFrom(this.api.getPhotos());

    for (const sp of serverPhotos) {
      const exists = await this.storage.photoExists(Number(sp.id));
      if (exists) {
        console.log(`ℹ️ PhotoDataService: Photo with id=${sp.id} already exists in IndexedDB, skipping`);
        continue;
      }

      const file = await this.api.downloadPhotoFile(sp.id);

      const photoToStore: PhotoToStore = {
        file: file,
        fileName: sp.fileName,
        description: sp.description,
        title: sp.title,
        exif: sp.exifData,
        isSynced: true
      };

      await this.storage.savePhotoWithId(Number(sp.id), photoToStore); // 💡 гл. ніжэй
    }

    console.log('✅ PhotoDataService: Photos from server loaded into IndexedDB');
  }

  async uploadPhotoToServer(photo: Photo): Promise<void> {
    console.log('🔄 PhotoDataService: Сінхранізуем фота з серверам:', photo.id, photo.fileName);
    if (!photo.file) {
      console.warn('❌ PhotoDataService: Photo.file адсутнічае, сінхранізацыя не будзе выканана', photo);
      return;
    }

    const formData = new FormData();
    formData.append('ImageFile', photo.file);
    const title = photo.title && photo.title.trim() !== '' ? photo.title : '[Без назвы]';
    formData.append('Title', title ?? '');
    formData.append('Description', photo.description ?? '');
    formData.append('ExifData', JSON.stringify(photo.exifData ?? {}));

    try {
      const originalId = photo.id; // ✅ Захоўваем стары ID перад заменай

      const response = await firstValueFrom(this.api.uploadPhoto(formData));
      console.log('✅ PhotoDataService: Загрузка на сервер удалася');

      // ✅ Ствараем новую копію для захавання
      const newPhoto: PhotoToStore = {
        file: photo.file,
        fileName: photo.fileName,
        title: photo.title,
        description: photo.description,
        exif: photo.exifData,
        isSynced: true
      };

      // ✅ Выдаляем старую версію з IndexedDB
      await this.storage.deletePhoto(originalId);
      console.log(`🗑️ PhotoDataService: Photo deleted from IndexedDB (id=${originalId})`);

      // ✅ Захоўваем новую версію з новым ID
      console.log(`PhotoDataService: Photo returned from server with id: ${response.id}`);
      await this.storage.savePhotoWithId(Number(response.id), { ...newPhoto, file: photo.file });

    } catch (error) {
      console.error('❌ PhotoDataService: Error syncing photo to server:', error);
    }
  }

  async syncWithServer(): Promise<void> {
    console.log('🔄 PhotoDataService: Запуск сінхранізацыі фотак...');
    try {
      const unsyncedPhotos = await this.storage.getPhotosForSync();

      for (const photo of unsyncedPhotos) {
        await this.uploadPhotoToServer(photo as Photo); // або ствары асобны мапінг, калі трэба
      }

    } catch (error) {
      console.error('❌ PhotoDataService: Памылка пры сінхранізацыі з сервером:', error);
    }
  }

  async deletePhoto(photo: Photo): Promise<void> {
    console.log("➡️ PhotoDataService: Маркіруем фота як выдаленае ў IndexedDB:", photo);
    await this.storage.markPhotoDeleted(photo.id);
    // console.log("➡️ Выдаляем фота праз рэпазіторый:", photo);
    // await this.storage.deletePhoto(photo.id);
  }

  async clearLocalStorage(): Promise<void> {
    await this.storage.clearAllPhotos();
  }
}
