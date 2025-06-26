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
      const exists = await this.storage.photoExists(sp.id);
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

      await this.storage.savePhotoWithId(sp.id, photoToStore); // 💡 гл. ніжэй
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
      await this.storage.savePhotoWithId(response.id, { ...newPhoto, file: photo.file });

    } catch (error) {
      console.error('❌ PhotoDataService: Error syncing photo to server:', error);
    }
  }

  async syncWithServer(): Promise<void> {
    console.log('🔄 PhotoDataService: Запуск сінхранізацыі фотак...');
    try {
      const unsyncedPhotos = await this.storage.getPhotosForSync();

      for (const photo of unsyncedPhotos) {
        console.log('🔍 Праверка photo:', photo.id, 'isDeleted =', photo.isDeleted);
        if (photo.isDeleted) {
          if (!photo.id) {
            console.warn(`⚠️ PhotoDataService: Фота без id, прапускаем выдаленне`, photo);
            continue;
          }

          console.log(`🗑️ PhotoDataService: Фота з id=${photo.fileName} пазначана на выдаленне`);
          console.log('📡 Спрабуем выдаліць photo.id =', photo.id);
          await this.api.deletePhoto(photo.id); // чакаем, пакуль выдаліцца з сервера
          await this.storage.deletePhoto(photo.id); // потым выдаляем з IndexedDB
          console.log(`✅ PhotoDataService: Фота з id=${photo.fileName} выдалена з сервера і IndexedDB`);
        } else {
          await this.uploadPhotoToServer(photo as Photo);
        }
      }

    } catch (error) {
      console.error('❌ PhotoDataService: Памылка пры сінхранізацыі з сервером:', error);
    }
  }

  async deletePhoto(photo: Photo): Promise<void> {
    console.log("➡️ PhotoDataService: Маркіруем фота як выдаленае ў IndexedDB:", photo);

    // ✅ 1. Калі фота было ўжо сінхранізавана — маркіруем
    if (photo.isSynced) {
      await this.storage.markPhotoDeleted(photo.id);
      console.log("🟡 PhotoDataService: Фота пазначана як выдаленае і будзе выдалена пры сінхранізацыі");
      return;
    }

    // ✅ 2. Калі фота яшчэ не сінхранізавана — проста выдаляем
    await this.storage.deletePhoto(photo.id);
    console.log("🗑️ PhotoDataService: Фота выдалена з IndexedDB");
  }

  async markPhotoDeleted(id: number | string): Promise<void> {
    console.log(`PhotoDataService: Marking photo id=${id} as deleted`);
    return this.storage.markPhotoDeleted(id);
  }

  async clearLocalStorage(): Promise<void> {
    await this.storage.clearAllPhotos();
  }
}
