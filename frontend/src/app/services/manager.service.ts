import { Injectable } from '@angular/core';

import { Gallery, GalleryBase } from '../models/gallery-interfaces';
import { Photo } from '../models/photo-interfaces';

import { LoggerService } from './logger.service';

import { GalleryManagerService } from './galleryServices/gallery-manager.service';
import { PhotoManagerService } from './photoServices/photo-manager.service';
import { ReconciliationService } from './syncServices/reconciliation.service';
import { IndexedDbService } from './indexedDbServices/indexedDb.service';

import { DB_NAME, DB_VERSION } from '../config/db-config';
import { Observable } from 'rxjs';
import { PhotoStateService } from './stateServices/photo-state.service';
import { PhotoFilterService } from './photoFilter/photo-filter.service';


export interface IManagerService {

    initApp(): Promise<void>;
    initDbStores(): Promise<void>;
    sync(): Promise<void>;

    addGallery(newGallery: Partial<GalleryBase> & { name: string }): Promise<Gallery>;
    updateGallery(id: number, updates: Partial<GalleryBase>): Promise<void>;
    deleteGallery(id: number): Promise<void>;
    getGalleries(): Gallery[];
    getSelectedGallery(): Gallery | null;

    addPhoto(file: File, galleryId: number): Promise<Photo>;
    updatePhoto(id: number, title: string, description: string): Promise<void>;
    deletePhoto(photo: Photo): Promise<void>;
    getPhotosForSelectedGallery(): Observable<Photo[]>;
    
    selectGallery(gallery: Gallery): void;
}


@Injectable({
    providedIn: 'root'
})
export class ManagerService implements IManagerService {
    constructor(
        private logger: LoggerService,
        private galleryManagerService: GalleryManagerService,
        private photoManagerService: PhotoManagerService,
        private photoState: PhotoStateService,
        private indexedDbService: IndexedDbService,
        private photoFilterService: PhotoFilterService,
        private reconciliation: ReconciliationService,
    ) { }

    /**
     * Ініцыялізуе IndexedDB (усе stores), загружае галерэі і фоткі ў state,
     * сінхранізуе несінхранізаваныя дадзеныя з серверам
     */
    async initApp(): Promise<void> {

        // 1. Ініцыялізацыя IndexedDB
        await this.initDbStores();

        // 2. Загрузка дадзеных з IndexedDB у state
        await this.galleryManagerService.loadInitialData();
        await this.photoManagerService.loadInitialData();

        // 3. Сінхранізацыя дадзеных (галерэі, фота, арфанскія запісы)
        await this.reconciliation.reconcile();

        // 4. Паўторная загрузка з IndexedDB пасля сінхранізацыі
        await this.galleryManagerService.loadInitialData();
        await this.photoManagerService.loadInitialData();

        // 5. Аднаўленьне выбранай галерэі
        this.galleryManagerService.restoreSelectedGallery();
    }

    async initDbStores(): Promise<void> {
        await this.indexedDbService.initDB(DB_NAME, DB_VERSION, (db) => {
            this.galleryManagerService.defineObjectStore(db);
            this.photoManagerService.defineObjectStore(db);
        });

        const db = this.indexedDbService.getDbOrThrow(DB_NAME);
        this.galleryManagerService.setDbInstance(db);
        this.photoManagerService.setDbInstance(db);
    }

    async sync(): Promise<void> {
        this.logger.log('--h', 'ManagerService: starting sync');
        // await this.galleryManagerService.syncWithServer({});
        await this.photoManagerService.syncWithServer({});
    }


    // --- CRUD галерэй ---

    async addGallery(newGallery: Partial<GalleryBase> & { name: string }): Promise<Gallery> {
        const now = new Date().toISOString();
        const galleryBase: GalleryBase = {
            ...newGallery,
            isSynced: false,
            isHidden: false,
            createdAt: now,
            updatedAt: now,
        };
        await this.galleryManagerService.addGallery(galleryBase);
        const galleries = this.galleryManagerService.getGalleries();
        return galleries[galleries.length - 1]; // апошняя дададзеная
    }

    async updateGallery(id: number, updates: Partial<GalleryBase>): Promise<void> {
        const enrichedUpdates = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await this.galleryManagerService.updateGallery(id, enrichedUpdates);
    }

    async deleteGallery(id: number): Promise<void> {
        // Заглушка
        this.logger.log('--h', `ManagerService.deleteGallery: выдаляем галерэю з id=${id}`);
        await this.galleryManagerService.deleteGallery(id);
    }

    getGalleries(): Gallery[] {
        // Заглушка
        this.logger.log('--h', 'ManagerService.getGalleries: вяртаем спіс галерэй');
        return this.galleryManagerService.getGalleries();
    }

    getSelectedGallery(): Gallery | null {
        return this.galleryManagerService.getGalleries().find(
            g => g.id === this.galleryManagerService.getSelectedGalleryId()
        ) ?? null;
    }

    

    // --- CRUD фотак ---

    async addPhoto(file: File, galleryId: number): Promise<Photo> {
        this.logger.log('--h', `ManagerService: Дадаю фота ў галерэю з id ${galleryId}`);
        const createdPhoto = await this.photoManagerService.addPhoto(file, galleryId);
        return createdPhoto;
    }

    async updatePhoto(id: number, title: string, description: string): Promise<void> {
        await this.photoManagerService.updatePhoto(id, title, description);
        const updatedPhotos = await this.photoManagerService.getAllPhotos();
        this.photoState.setPhotos(updatedPhotos);
    }

    async deletePhoto(photo: Photo): Promise<void> {
        await this.photoManagerService.deletePhoto(photo);
        const updatedPhotos = await this.photoManagerService.getAllPhotos();
        this.photoState.setPhotos(updatedPhotos);
    }

    getPhotosForSelectedGallery(): Observable<Photo[]> {
        return this.photoFilterService.getPhotosForSelectedGallery();
    }



    selectGallery(gallery: Gallery): void {
        this.galleryManagerService.setSelectedGalleryId(gallery.id);
        // Магчыма яшчэ нейкія дзеянні па абнаўленню стану
    }

}
