import { Injectable } from '@angular/core';
import { Photo } from '../models/photo';
import * as exifr from 'exifr';

export interface PhotoToStore {
  file: File;
  fileName: string;
  description?: string;
  title?: string;
  exif?: any;
  isSynced?: boolean;
  isDeleted?: boolean;   // Пазначана на выдаленне
  isModified?: boolean;  // Апісанне/іншыя даныя зменены
}

@Injectable({
  providedIn: 'root'
})
export class PhotoIndexedDbService {
  private dbName = 'PhotoLibDB';
  private dbVersion = 1;
  private storeName = 'photos';
  private db!: IDBDatabase;

  constructor() {
    this.initDB(); // запускаем ініцыялізацыю
  }

  private initDB(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        console.log('✅ PhotoIndexedDbService: Store "photos" created');
      }
    };

    request.onsuccess = () => {
      this.db = request.result;
      console.log('📂 PhotoIndexedDbService: IndexedDB opened successfully');
    };

    request.onerror = () => {
      console.error('❌ PhotoIndexedDbService: Error opening IndexedDB:', request.error);
    };
  }


  async waitForDBReady(): Promise<void> {
    if (this.db) return;

    await new Promise<void>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.db) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject('⚠️ PhotoIndexedDbService: Timeout: IndexedDB not initialized');
      }, 3000); // 3 seconds max
    });
  }

  async savePhoto(photo: PhotoToStore): Promise<number> {
    await this.waitForDBReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const photoData = {
        file: photo.file,
        fileName: photo.fileName,
        type: photo.file.type,
        date: new Date().toISOString(),
        description: photo.description || '',
        title: photo.title || '',
        exif: photo.exif || null,
        isSynced: photo.isSynced ?? false
      };

      const request = store.add(photoData);

      request.onsuccess = (event) => {
        const id = (event.target as IDBRequest).result as number;
        console.log('✅ PhotoIndexedDbService: Photo saved in IndexedDB, ID =', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('❌ PhotoIndexedDbService: Error saving photo in IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  async savePhotoWithId(id: number, photo: PhotoToStore): Promise<void> {
  await this.waitForDBReady();

  return new Promise((resolve, reject) => {
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const photoData = {
      id: id, // 🔧 Усталёўваем серверны id
      file: photo.file,
      fileName: photo.fileName,
      type: photo.file.type,
      date: new Date().toISOString(),
      description: photo.description || '',
      title: photo.title || '',
      exif: photo.exif || null,
      isSynced: photo.isSynced ?? false
    };

    const request = store.add(photoData); // `add`, не `put`

    request.onsuccess = () => {
      console.log('✅ PhotoIndexedDbService: Photo saved with server ID =', id);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ PhotoIndexedDbService: Error saving photo with server ID:', request.error);
      reject(request.error);
    };
  });
}


  async getAllPhotos(): Promise<Photo[]> {
    await this.waitForDBReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawPhotos = request.result as any[];

        const photosWithUrl = rawPhotos.map(p => ({
          ...p,
          url: URL.createObjectURL(p.file),
          isSynced: p.synced ?? false,
          id: p.id
        }));

        resolve(photosWithUrl as Photo[]);
      };

      request.onerror = () => {
        console.error('❌ PhotoIndexedDbService: Error loading photos from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  async photoExists(id: number): Promise<boolean> {
    await this.waitForDBReady();

    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  }



  async getPhotosForSync(): Promise<PhotoToStore[]> {
    await this.waitForDBReady();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const allPhotos = request.result as PhotoToStore[];
        const photosToSync = allPhotos.filter(p => !p.isSynced || p.isDeleted || p.isModified);
        resolve(photosToSync);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updatePhoto(photo: any): Promise<void> {
    await this.waitForDBReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(photo);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async extractExifData(file: File): Promise<any> {
    try {
      const exif = await exifr.parse(file, {
        gps: true,        // GPS дадзеныя
        exif: true,       // EXIF-інфо (дата, ISO, дыяфрагма і г.д.)
      });
      console.log("📸 PhotoIndexedDbService: EXIF extracted:", exif);
      return exif ?? {};
    } catch (error) {
      console.error("❌ PhotoIndexedDbService: Failed to extract EXIF data:", error);
      return {};
    }
  }

  async deletePhoto(id: number | string): Promise<void> {
    if (!this.db) {
      console.error('PhotoIndexedDbService: DB not initialized');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      const request = store.delete(id);

      request.onerror = () => {
        console.error('❌ PhotoIndexedDbService: Памылка пры выдаленні фота з IndexedDB');
        reject(request.error);
      };

      tx.oncomplete = () => {
        console.log(`🗑️ PhotoIndexedDbService: Фота з id=${id} выдалена з IndexedDB`);
        resolve();
      };

      tx.onerror = () => {
        console.error('❌ PhotoIndexedDbService: Памылка транзакцыі пры выдаленні');
        reject(tx.error);
      };
    });
  }

  async markPhotoDeleted(id: number | string): Promise<void> {
    await this.waitForDBReady();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const photo = getRequest.result;
        if (!photo) {
          reject(`PhotoIndexedDbService: Photo with id=${id} not found`);
          return;
        }
        photo.isDeleted = true;
        photo.isSynced = false;

        const putRequest = store.put(photo);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearAllPhotos(): Promise<void> {
    await this.waitForDBReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('✅ PhotoIndexedDbService: IndexedDB photos cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ PhotoIndexedDbService: Error clearing IndexedDB photos:', request.error);
        reject(request.error);
      };
    });
  }
}