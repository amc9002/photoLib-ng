import { Injectable } from '@angular/core';
import { Photo, PhotoToStore, PhotoToUpdate } from '../models/photo-interfaces';
import * as exifr from 'exifr';
import { DomSanitizer } from '@angular/platform-browser';


type StoredPhoto = PhotoToStore & { id: number | string };

@Injectable({
  providedIn: 'root'
})
export class PhotoIndexedDbService {
  private dbName = 'PhotoLibDB';
  private dbVersion = 1;
  private storeName = 'photos';
  private db!: IDBDatabase;

  private dbInitPromise!: Promise<void>;

  constructor(
    private sanitizer: DomSanitizer

  ) {
    this.dbInitPromise = this.initDB(); // запамінаем проміс
  }

  initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
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
        resolve();
      };

      request.onerror = () => {
        console.error('❌ PhotoIndexedDbService: Error opening IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }


  private async waitForDBReady(): Promise<void> {
    await this.dbInitPromise; // чакаем, пакуль база будзе адкрыта
  }


  private async performTransaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore, transaction: IDBTransaction) => Promise<T> | T
  ): Promise<T> {
    await this.waitForDBReady();

    return new Promise<T>((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], mode);
      const store = transaction.objectStore(this.storeName);

      // Выклікаем перададзеную функцыю
      Promise.resolve(operation(store, transaction))
        .then(result => {
          transaction.oncomplete = () => resolve(result);
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        })
        .catch(err => {
          transaction.abort();
          reject(err);
        });
    });
  }


  async saveNew(photo: PhotoToStore): Promise<number> {
    return this.performTransaction<number>('readwrite', (store) => {
      return new Promise<number>((resolve, reject) => {
        const request = store.add(photo);

        request.onsuccess = (event) => {
          const id = (event.target as IDBRequest).result as number;
          console.log('✅ PhotoIndexedDbService.saveNew: Фота захавана з id =', id);
          resolve(id);
        };

        request.onerror = () => {
          console.error('❌ PhotoIndexedDbService.saveNew: Памылка пры захаванні:', request.error);
          reject(request.error);
        };
      });
    });
  }


  async savePhotoWithId(id: number | string, photoData: any): Promise<void> {
    if (!photoData.file) {
      return Promise.reject('❌ PhotoIndexedDbService: photoData.file is undefined');
    }

    const dataToStore = { ...photoData, id };

    return this.performTransaction<void>('readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(dataToStore);

        request.onsuccess = () => {
          console.log('✅ PhotoIndexedDbService: Photo saved with server ID =', id);
          resolve();
        };

        request.onerror = () => {
          console.error('❌ PhotoIndexedDbService: Error saving photo with server ID:', request.error);
          reject(request.error);
        };
      });
    });
  }


  async getAllPhotos(): Promise<Photo[]> {
    return this.performTransaction<Photo[]>('readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const rawPhotos = request.result as any[];

          const filteredPhotos = rawPhotos.filter(p => !p.isDeleted);

          const photosWithUrl = filteredPhotos.map(p => {
            if (!(p.file instanceof File)) {
              console.warn('⚠️ file is not a File instance!', p.file);
            }

            const url = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(p.file));
            console.log('🖼️ Створаны url для photo.id =', p.id, url);

            return {
              ...p,
              url: url,
              isSynced: p.isSynced ?? false,
              id: p.id
            };
          });

          resolve(photosWithUrl as Photo[]);
        };

        request.onerror = () => {
          console.error('❌ PhotoIndexedDbService: Error loading photos from IndexedDB:', request.error);
          reject(request.error);
        };
      });
    });
  }


  async getPhotoById(id: number | string): Promise<Photo | undefined> {
    return this.performTransaction<Photo | undefined>('readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result as Photo);
          } else {
            resolve(undefined);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }


  async getRawPhotoById(id: number | string): Promise<any | null> {
    await this.waitForDBReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('❌ PhotoIndexedDbService: памылка пры чытанні photo:', request.error);
        reject(request.error);
      };
    });
  }


  async photoExists(id: number | string): Promise<boolean> {
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
        const allPhotos = request.result as (StoredPhoto)[];
        const photosToSync = allPhotos.filter(p => !p.isSynced || p.isDeleted || p.isModified);
        resolve(photosToSync);
      };

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


  async updatePhoto(updatedPhoto: PhotoToUpdate): Promise<void> {
    if (updatedPhoto.id === undefined) {
      return Promise.reject('❌ PhotoIndexedDbService: Cannot update photo without id');
    }

    const id = updatedPhoto.id;

    return this.performTransaction<void>('readwrite', (store) => {
      const request = store.get(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const existing = request.result;
          if (!existing) {
            reject(`❌ PhotoIndexedDbService: Photo with id=${updatedPhoto.id} not found`);
            return;
          }

          const updated = {
            ...existing,
            ...updatedPhoto,
          };

          const putRequest = store.put(updated);

          putRequest.onsuccess = () => {
            console.log(`✅ PhotoIndexedDbService: Photo updated (id=${updatedPhoto.id})`);
            resolve();
          };

          putRequest.onerror = () => reject(putRequest.error);
        };

        request.onerror = () => reject(request.error);
      });
    });
  }


  async deletePhoto(id: number | string): Promise<void> {
    console.log('🧹 PhotoIndexedDbService: deletePhoto: id =', id, typeof id);

    if (!this.db) {
      console.error('PhotoIndexedDbService: DB not initialized');
      return;
    }

    if (id === undefined) {
      return Promise.reject('❌ PhotoIndexedDbService.deletePhoto: id is undefined');
    }

    return this.performTransaction<void>('readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(id);

        request.onerror = () => {
          console.error('❌ PhotoIndexedDbService: Памылка пры выдаленні фота з IndexedDB');
          reject(request.error);
        };

        resolve();  // тут resolve выклікаецца пры delete без wait, таму мы таксама пакуем у tx.oncomplete ніжэй

      });
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