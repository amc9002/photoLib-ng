import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Photo } from '../../models/photo-interfaces';
import { PhotoIndexedDbService } from '../indexedDbServices/photo-indexedDB.service';
import { PhotoApiService } from '../apiServices/photo-api.service';
import { PhotoBuilderService } from '../photoServices/photo-builder.service';
import { PhotoStateService } from '../stateServices/photo-state.service';

interface SyncOptions {
    fullReconcile?: boolean;
    syncNew?: boolean;
    syncUpdated?: boolean;
    syncDeleted?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PhotoSyncService {
    constructor(
        private storage: PhotoIndexedDbService,
        private api: PhotoApiService,
        private photoBuilder: PhotoBuilderService,
        private state: PhotoStateService
    ) { }

    async syncWithServer(options: SyncOptions = {}): Promise<void> {
        console.log('🔄 PhotoSyncService: запуск сінхранізацыі з параметрамі', options);

        if (options.fullReconcile) {
            console.warn('⚠️ PhotoSyncService: fullReconcile=true, але логіка reconcile цяпер у ReconciliationService');
        }

        const photosInState = this.state.getPhotosSnapshot();
        console.log('🗂 PhotoSyncService.Photos in state:', photosInState.map(p => ({ id: p.id, galleryId: p.galleryId, isSynced: p.isSynced })));

        const unsyncedPhotos = (await this.storage.getPhotosForSync()).filter(p => p.id !== undefined) as Photo[];
        console.log('📦 PhotoSyncService.getPhotosForSync: photos from IndexedDB:', unsyncedPhotos.map(p => ({ id: p.id, galleryId: p.galleryId, isSynced: p.isSynced })));

        for (const photo of unsyncedPhotos) {
            console.log(`PhotoSyncService.syncWithServer: Photo id=${photo.id}, galleryId=${photo.galleryId}`);
            await this.syncSinglePhoto(photo, options);
        }
    }

    async syncPhotosForGallery(galleryId: number): Promise<void> {
        const all = await this.storage.getPhotosByGalleryId(galleryId);
        const unsynced = all.filter(p => !p.isSynced);

        for (const photo of unsynced) {
            await this.syncSinglePhoto(photo, { syncNew: true });
        }
    }

    private async syncSinglePhoto(photo: Photo, options: SyncOptions): Promise<void> {
        const actions = [
            {
                name: 'delete',
                enabled: options.syncDeleted !== false,
                condition: (p: Photo) => p.isDeleted,
                action: (p: Photo) => this.syncDeletedPhoto(p)
            },
            {
                name: 'update',
                enabled: options.syncUpdated !== false,
                condition: (p: Photo) => p.isModified && p.isSynced,
                action: (p: Photo) => this.syncUpdatedPhoto(p)
            },
            {
                name: 'uploadNew',
                enabled: options.syncNew !== false,
                condition: (p: Photo) => !p.isSynced,
                action: (p: Photo) => this.syncNewPhoto(p)
            }
        ];

        const matchedAction = actions.find(a => a.enabled && a.condition(photo));
        if (matchedAction) {
            console.log(`🔁 Сінхранізуем фота id=${photo.id} → ${matchedAction.name}`);
            await matchedAction.action(photo);
        } else {
            console.log(`✅ Photo id=${photo.id} не патрабуе сінхранізацыі`);
        }
    }

    private async syncNewPhoto(photo: Photo): Promise<Photo> {
        console.log('Sync new photo id=', photo.id);
        if (!photo.file) throw new Error(`❌ No file to upload for photo id=${photo.id}`);

        const formData = this.photoBuilder.buildFormData(photo, { includeFileName: true });

        const response = await firstValueFrom(this.api.uploadPhoto(formData));

        const updatedPhoto: Photo = {
            ...photo,
            id: response.id,
            isSynced: true,
            isModified: false
        };

        await this.storage.savePhotoWithId(response.id, updatedPhoto);
        if (photo.id !== response.id) await this.storage.deletePhoto(photo.id);

        return updatedPhoto;
    }

    private async syncUpdatedPhoto(photo: Photo): Promise<void> {
        console.log('Sync updated photo id=', photo.id);
        if (photo.id === undefined) return;

        const formData = this.photoBuilder.buildFormData(photo);
        await firstValueFrom(this.api.updatePhoto(photo.id, formData));

        const photoToUpdate = this.photoBuilder.buildPhotoToUpdate(photo);
        await this.storage.updatePhoto(photoToUpdate);

        console.log(`✅ Photo id=${photo.id} updated on server and in IndexedDB`);
    }

    private async syncDeletedPhoto(photo: Photo): Promise<void> {
        console.log('PhotoSyncService: Sync deleted photo id=', photo.id);
        await this.api.deletePhoto(photo.id);
        await this.storage.deletePhoto(photo.id);
        console.log(`✅ Photo id=${photo.id} deleted on server and in IndexedDB`);
    }

    async getServerPhotoIds(): Promise<Set<string>> {
        const serverPhotos = await this.getServerPhotos();
        return new Set(serverPhotos.map(p => String(p.id)));
    }

    getServerPhotos(): Promise<Photo[]> {
        return firstValueFrom(this.api.getPhotos());
    }

}

