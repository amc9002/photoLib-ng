import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GalleryApiService } from '../../services/apiServices/gallery-api.service';
import { GalleryIndexedDbService } from '../../services/indexedDbServices/gallery-indexedDb.service';
import { Gallery } from '../../models/gallery-interfaces';
import { GalleryStateService } from '../stateServices/gallery-state.service';
import { PhotoSyncService } from './photo-sync.service';
import { PhotoIndexedDbService } from '../indexedDbServices/photo-indexedDB.service';

@Injectable({
    providedIn: 'root'
})
export class GallerySyncService {
    constructor(
        private galleryApi: GalleryApiService,
        private galleryDb: GalleryIndexedDbService,
        private photoDb: PhotoIndexedDbService,
        private galleryState: GalleryStateService,
        private photoSync: PhotoSyncService
    ) { }

    async syncSingleGallery(localGallery: Gallery): Promise<Gallery | null> {
        try {
            const createdGallery = await firstValueFrom(this.galleryApi.createGallery({
                name: localGallery.name,
                isHidden: localGallery.isHidden,
                isSynced: true
            }));

            const updatedGallery: Gallery = {
                ...localGallery,
                id: createdGallery.id,
                isSynced: true
            };

            console.log('🔍 GallerySyncService: Before replaceGalleryId, localGallery.id =', localGallery.id);
            const galleriesBefore = await this.galleryDb.getAllGalleries();
            console.log('🔍 GallerySyncService: Galleries before replace:', galleriesBefore);

            // Абнаўляем IndexedDB
            await this.galleryDb.replaceGalleryId(localGallery.id, updatedGallery);

            // 🆕 Абнаўляем galleryId ва ўсіх фота
            await this.photoDb.updatePhotosGalleryId(localGallery.id, updatedGallery.id);

            const galleriesAfter = await this.galleryDb.getAllGalleries();
            console.log('🔍 GallerySyncService: Galleries after replace:', galleriesAfter);

            // Абнаўляем state
            this.galleryState.updateGallery(localGallery.id, updatedGallery);
            if (this.galleryState.getSelectedGallery()?.id === localGallery.id) {
                this.galleryState.setSelectedGallery(updatedGallery);
            }

            console.log(`✅ GallerySyncService: Gallery "${localGallery.name}" synchronized`);

            // Сінхранізуем фоткі гэтай галерэі
            await this.photoSync.syncPhotosForGallery(createdGallery.id);

            return updatedGallery;
        } catch (err) {
            console.error('❌ GallerySyncService: Sync failed for gallery', localGallery, err);
            localGallery.isSynced = false;
            await this.galleryDb.updateGallery(localGallery.id, { isSynced: false });
            this.galleryState.updateGallery(localGallery.id, localGallery);
            if (this.galleryState.getSelectedGallery()?.id === localGallery.id) {
                this.galleryState.setSelectedGallery(localGallery);
            }
            return null;
        }
    }


    async syncUnsyncedGalleries(): Promise<void> {
        const unsyncedGalleries = await this.galleryDb.getGalleriesForSync();

        for (const localGallery of unsyncedGalleries) {
            await this.syncSingleGallery(localGallery);
        }
    }

}

