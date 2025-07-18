import { Injectable } from '@angular/core';
import { Photo, PhotoToStore, PhotoToUpdate } from '../../models/photo-interfaces';
import * as exifr from 'exifr';
import { DomSanitizer } from '@angular/platform-browser';
import { IndexedDbService } from './indexedDb.service';
import { DB_NAME, STORE_NAMES } from '../../config/db-config';
import { LoggerService } from '../logger.service';


export interface IPhotoDbAccessPort {
  /**
   * Усталяваць спасылку на IndexedDB базу.
   * Выкарыстоўваецца для ініцыялізацыі сэрвісу пасля адкрыцця базы.
   *
   * @param db Аб’ект базы дадзеных IndexedDB
   */
  setDb(db: IDBDatabase): void;

  /**
   * Праверыць, ці існуе фота з дадзеным id у IndexedDB.
   *
   * @param id Ідэнтыфікатар фота
   * @returns Promise<boolean>: true — калі фота існуе, інакш false
   */
  photoExists(id: number): Promise<boolean>;

  /**
   * Дадаць новае фота ў IndexedDB.
   *
   * @param photo Аб’ект фота, уключаючы файл і метаданыя
   * @returns Promise<number> з новым аўтаматычна згенераваным id
   */
  addPhoto(photo: Photo): Promise<number>;

  /**
   * Захаваць фота без файла — толькі метаданыя.
   * Выкарыстоўваецца для фота, загружаных з сервера, калі файл адсутнічае.
   *
   * @param photo Аб’ект фота без файла
   */
  savePhotoMetadataOnly(photo: Photo): Promise<void>;

  /**
   * Захаваць фота з зададзеным id (атрыманым ад сервера).
   * Калі файл адсутнічае — адхіляе аперацыю.
   *
   * @param id Пэўны id, які трэба прысвоіць фота
   * @param photoData Аб’ект фота (уключаючы файл)
   */
  savePhotoWithId(id: number, photoData: Photo): Promise<void>;

  /**
   * Атрымаць усе фота, якія захоўваюцца ў IndexedDB.
   *
   * @returns Promise<Photo[]> са спісам усіх фота
   */
  getAllPhotos(): Promise<Photo[]>;

  /**
   * Атрымаць усе фота, якія належаць да канкрэтнай галерэі.
   *
   * @param galleryId Ідэнтыфікатар галерэі
   * @returns Promise<Photo[]> са спісам фота гэтай галерэі
   */
  getPhotosByGalleryId(galleryId: number): Promise<Photo[]>;

  /**
   * Атрымаць фота па унікальным id з IndexedDB.
   *
   * Звычайна фотаздымкі павінны чытацца з кэшаванага стэйта,
   * але гэты метад карысны для прамога доступу да IndexedDB у выпадках,
   * калі неабходна загрузіць асобнае фота па id (напрыклад, lazy-загрузка,
   * або кропкавае абнаўленне).
   *
   * @param id Ідэнтыфікатар фота
   * @returns Promise<Photo | undefined>
   */
  getPhotoById(id: number): Promise<Photo | undefined>;

  /**
   * Атрымаць сыры (raw) аб’ект фота з IndexedDB па id.
   * Вяртае дадзеныя ў тым выглядзе, у якім яны захоўваюцца,
   * без дадатковай апрацоўкі.
   *
   * @param id Ідэнтыфікатар фота
   * @returns Promise<any | null>: сыры аб’ект або null, калі не знойдзены
   */
  getRawPhotoById(id: number): Promise<any | null>;

  /**
   * Атрымаць усе фота, якія яшчэ не былі сінхранізаваныя з серверам.
   *
   * @returns Promise<Photo[]> са спісам фота для сінхранізацыі
   */
  getPhotosForSync(): Promise<Photo[]>;

  /**
   * Выцягнуць EXIF-метаданыя з файла фота.
   *
   * Выкарыстоўваецца бібліятэка `exifr` для атрымання тэхнічнай інфармацыі,
   * уключаючы GPS-каардынаты, дату стварэння, налады камеры і інш.
   *
   * @param file Файл фатаграфіі
   * @returns Promise<any> з EXIF-метаданымі або пусты аб’ект у выпадку памылкі
   */
  extractExifData(file: File): Promise<any>;

  /**
   * Абнавіць фота па id.
   *
   * @param photo Аб’ект PhotoToUpdate з ідэнтыфікатарам і абноўленымі полямі
   */
  updatePhoto(photo: PhotoToUpdate): Promise<void>;

  /**
   * Абнавіць усе фота, што належалі да oldGalleryId, замяніўшы на newGalleryId.
   *
   * Выкарыстоўваецца пры сінхранізацыі, калі часовы id замяняецца на пастаянны.
   *
   * @param oldGalleryId Старое значэнне galleryId
   * @param newGalleryId Новы galleryId
   */
  updatePhotosGalleryId(oldGalleryId: number, newGalleryId: number): Promise<void>;

  /**
   * Выдаліць фота з IndexedDB па id.
   *
   * @param id Ідэнтыфікатар фота, якое трэба выдаліць
   */
  deletePhoto(id: number): Promise<void>;

  /**
   * Выдаліць усе фота з IndexedDB.
   * Выкарыстоўваецца пры поўнай ачыстцы або рэсэтынгу дадзеных.
   */
  deleteAllPhotos(): Promise<void>;

  /**
   * Замяніць фота з адным id на іншае фота.
   * Выкарыстоўваецца, калі новае фота павінна заняць месца старога (напрыклад, пасля сінхранізацыі).
   *
   * @param oldId Id, які трэба замяніць
   * @param newPhoto Новы аб’ект Photo, які замяняе старое фота
   */
  replacePhotoId(oldId: number, newPhoto: Photo): Promise<void>;
}


@Injectable({
  providedIn: 'root'
})
export class PhotoIndexedDbService implements IPhotoDbAccessPort {
  private dbName = DB_NAME;
  private storeName = STORE_NAMES.PHOTOS;
  private db!: IDBDatabase;

  constructor(
    private logger: LoggerService,
    private sanitizer: DomSanitizer,
    private indexedDbService: IndexedDbService
  ) { }


  setDb(db: IDBDatabase): void {
    this.db = db;
  }


  async addPhoto(photo: PhotoToStore): Promise<number> {
    const result = await this.saveObject(photo, 'add');
    if (typeof result === 'number') return result;
    throw new Error('❌ PhotoIndexedDbService: ID is not a number');
  }

  async savePhotoWithId(id: number, photoData: any): Promise<void> {
    if (!photoData.file) {
      return Promise.reject('❌ PhotoIndexedDbService: photoData.file is undefined');
    }
    const dataToStore = { ...photoData, id };
    await this.saveObject(dataToStore, 'put');
  }
  /*калі на серверы маюцца фота, якія адсутнічаюць у IndexedDB*/
  async savePhotoMetadataOnly(photo: Photo): Promise<void> {
    const dataToStore = {
      ...photo,
      file: new File([], photo.fileName ?? 'server-photo.jpg'),
      isSynced: true
    };

    await this.saveObject(dataToStore, 'put');
  }


  async getAllPhotos(): Promise<Photo[]> {
    return this.withTransaction<Photo[]>('readonly', async (store) => {
      const request = store.getAll();
      const rawPhotos = await this.requestToPromise<any[]>(request);

      const filteredPhotos = rawPhotos.filter(p => !p.isDeleted);

      return filteredPhotos.map(p => {
        if (!(p.file instanceof File)) {
          this.logger.warn('--s', '⚠️ file is not a File instance!', p.file);
        }
        const url = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(p.file));
        this.logger.log('--h', '🖼️ Створаны url для photo.id =', p.id, url);

        return {
          ...p,
          url,
          isSynced: p.isSynced ?? false,
          id: p.id
        };
      });
    });
  }

  async getPhotosByGalleryId(galleryId: number): Promise<Photo[]> {
    return this.withTransaction<Photo[]>('readonly', async (store) => {
      const request = store.getAll();
      const allPhotos = await this.requestToPromise<Photo[]>(request);

      return allPhotos.filter(p => Number(p.galleryId) === Number(galleryId));
    });
  }

  async getPhotoById(id: number): Promise<Photo | undefined> {
    return this.withTransaction<Photo | undefined>('readonly', async (store) => {
      const request = store.get(id);
      const result = await this.requestToPromise<Photo | undefined>(request);
      return result;
    });
  }

  async getRawPhotoById(id: number): Promise<any | null> {
    return this.withTransaction<any | null>('readonly', async (store) => {
      const request = store.get(id);
      const raw = await this.requestToPromise<any | null>(request);
      return raw ?? null;
    });
  }

  async photoExists(id: number): Promise<boolean> {
    return this.withTransaction<boolean>('readonly', async (store) => {
      const request = store.get(id);
      try {
        const result = await this.requestToPromise<any>(request);
        return !!result;
      } catch {
        return false;
      }
    });
  }

  async getPhotosForSync(): Promise<Photo[]> {
    const allPhotos = await this.getAllPhotos(); // 🔄 Выкарыстоўваем агульны метад
    return allPhotos.filter(p => !p.isSynced || p.isDeleted || p.isModified);
  }

  async extractExifData(file: File): Promise<any> {
    try {
      const exif = await exifr.parse(file, {
        gps: true,        // GPS дадзеныя
        exif: true,       // EXIF-інфо (дата, ISO, дыяфрагма і г.д.)
      });
      this.logger.log('--h', "📸 PhotoIndexedDbService: EXIF extracted:", exif);
      return exif ?? {};
    } catch (error) {
      this.logger.error('--s', "❌ PhotoIndexedDbService: Failed to extract EXIF data:", error);
      return {};
    }
  }


  async updatePhoto(updatedPhoto: PhotoToUpdate): Promise<void> {
    if (updatedPhoto.id === undefined) {
      return Promise.reject('❌ Cannot update photo without id');
    }
    const id = updatedPhoto.id;

    return this.withTransaction<void>('readwrite', async (store) => {
      const getRequest = store.get(id);
      const existing = await this.requestToPromise<Photo | undefined>(getRequest);
      if (!existing) {
        throw new Error(`❌ Photo with id=${id} not found`);
      }
      const updated = {
        ...existing,
        ...updatedPhoto,
      };
      const putRequest = store.put(updated);
      await this.requestToPromise(putRequest);
      this.logger.log('--s', `✅ Photo updated (id=${id})`);
    });
  }

  async updatePhotosGalleryId(oldGalleryId: number, newGalleryId: number): Promise<void> {
    const photos = await this.getPhotosByGalleryId(oldGalleryId);
    for (const photo of photos) {
      await this.updatePhoto({ id: photo.id, galleryId: newGalleryId });
    }
    this.logger.log('--s', `✅ Updated ${photos.length} photos from galleryId=${oldGalleryId} to ${newGalleryId}`);
  }


  async replacePhotoId(oldId: number, newPhoto: Photo): Promise<void> {
    await this.deletePhoto(oldId);
    await this.savePhotoWithId(newPhoto.id, newPhoto);
    this.logger.log('--s', `✅ PhotoIndexedDbService: Замяніў фота id=${oldId} на id=${newPhoto.id}`);
  }


  async deletePhoto(id: number): Promise<void> {
    if (id === undefined) {
      return Promise.reject('❌ deletePhoto: id is undefined');
    }

    return this.withTransaction<void>('readwrite', async (store) => {
      const deleteRequest = store.delete(id);
      await this.requestToPromise(deleteRequest);
      this.logger.log('--s', `🗑️ Photo deleted (id=${id})`);
    });
  }

  async deleteAllPhotos(): Promise<void> {
    return this.withTransaction<void>('readwrite', async (store) => {
      const clearRequest = store.clear();
      await this.requestToPromise(clearRequest);
      this.logger.log('--s', '🧹 All photos deleted from IndexedDB');
    });
  }

  private withTransaction<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => Promise<T>
  ): Promise<T> {
    return this.indexedDbService.performTransaction(
      this.dbName,
      this.storeName,
      mode,
      (store) => action(store)
    );
  }

  private saveObject<T>(
    object: T,
    operation: 'add' | 'put'
  ): Promise<IDBValidKey | void> {
    return this.withTransaction('readwrite', (store) =>
      new Promise((resolve, reject) => {
        const request = store[operation](object);
        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest).result;
          console.log(`✅ PhotoIndexedDbService: ${operation} success`, result);
          resolve(result);
        };
        request.onerror = () => {
          console.error(`❌ PhotoIndexedDbService: ${operation} error`, request.error);
          reject(request.error);
        };
      })
    );
  }

  private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

}