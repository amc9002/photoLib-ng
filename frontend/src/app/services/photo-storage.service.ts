import { Injectable } from '@angular/core';
import { Photo } from '../models/photo';

@Injectable({
  providedIn: 'root'
})
export class PhotoStorageService {
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
        console.log('✅ Store "photos" created');
      }
    };

    request.onsuccess = () => {
      this.db = request.result;
      console.log('📂 IndexedDB opened successfully');
    };

    request.onerror = () => {
      console.error('❌ Error opening IndexedDB:', request.error);
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
        reject('⚠️ Timeout: IndexedDB not initialized');
      }, 3000); // 3 seconds max
    });
  }

  async savePhoto(photo: {
    file: File,
    description?: string,
    title?: string,
    exif?: any,
    synced?: boolean
  }): Promise<number> {
    await this.waitForDBReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const photoData = {
        file: photo.file,
        name: photo.file.name,
        type: photo.file.type,
        date: new Date().toISOString(),
        description: photo.description || '',
        title: photo.title || '',
        exif: photo.exif || null,
        synced: photo.synced ?? false
      };

      const request = store.add(photoData);

      request.onsuccess = (event) => {
        const id = (event.target as IDBRequest).result as number;
        console.log('✅ Photo saved in IndexedDB, ID =', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('❌ Error saving photo in IndexedDB:', request.error);
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
        resolve(request.result as Photo[]);
      };

      request.onerror = () => {
        console.error('❌ Error loading photos from IndexedDB:', request.error);
        reject(request.error);
      };
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
}