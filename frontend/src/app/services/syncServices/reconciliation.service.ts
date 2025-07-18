import { Injectable } from '@angular/core';
import { GalleryIndexedDbService } from '../indexedDbServices/gallery-indexedDb.service';
import { PhotoIndexedDbService } from '../indexedDbServices/photo-indexedDB.service';
import { GalleryApiService } from '../apiServices/gallery-api.service';
import { GallerySyncService } from './gallery-sync.service';
import { PhotoSyncService } from './photo-sync.service';
import { Photo } from '../../models/photo-interfaces';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../logger.service';
import { Gallery } from '../../models/gallery-interfaces';
import { OrphanedConfirmDialogComponent } from '../../shared/orphaned-confirm-dialog.ts/orphaned-confirm-dialog.ts.component';
import { GalleryStateService } from '../stateServices/gallery-state.service';
import { MatDialog } from '@angular/material/dialog';

@Injectable({ providedIn: 'root' })
export class ReconciliationService {
    constructor(
        private logger: LoggerService,
        private galleryDb: GalleryIndexedDbService,
        private photoDb: PhotoIndexedDbService,
        private galleryApi: GalleryApiService,
        private gallerySync: GallerySyncService,
        private photoSync: PhotoSyncService,
        private galleryState: GalleryStateService,
        private dialog: MatDialog
    ) { }

    async reconcile(): Promise<void> {
        const localGalleries = await this.galleryDb.getAllGalleries();
        const serverGalleries = await firstValueFrom(this.galleryApi.getGalleries());
        this.logger.log('--s', '🧪 ReconciliationService: атрыманыя галерэі з сервера:', serverGalleries);
        const serverGalleryIds = new Set(serverGalleries.map(g => g.id));

        const orphanedServerPhotos = await this.getOrphanedServerPhotos();
        if (orphanedServerPhotos.length > 0) {
            this.logger.warn('--s', `⚠️ Знойдзена ${orphanedServerPhotos.length} фота, якія ёсьць на серверы, але адсутнічаюць лакальна`);

            for (const photo of orphanedServerPhotos) {
                await this.photoDb.savePhotoMetadataOnly(photo); // ⬅️ Дадаем у IndexedDB
            }
        }

        for (const gallery of localGalleries) {
            if (!serverGalleryIds.has(gallery.id)) {
                this.logger.warn('--s', `⚠️ Gallery '${gallery.name}' (id=${gallery.id}) missing on server. Syncing...`);
                this.logger.log('--s', '💾 Syncing gallery in reconcile():', gallery);
                await this.gallerySync.syncSingleGallery(gallery);
            }

            await this.photoSync.syncPhotosForGallery(gallery.id);
        }

        this.logger.log('--s', '✅ Reconciliation complete');
    }


    private async getOrphanedLocalPhotos(): Promise<Photo[]> {
        const serverPhotoIds = await this.photoSync.getServerPhotoIds();
        const localPhotos = await this.photoDb.getAllPhotos();

        return localPhotos.filter(
            p => p.id !== undefined && !serverPhotoIds.has(String(p.id)) && !p.isDeleted
        );
    }


    /**
 * Вяртае фота, якія існуюць на сэрверы, але адсутнічаюць у лакальнай IndexedDB.
 *
 * Гэтыя фота лічацца "сіротамі" з пункту гледжання лакальнага кліента —
 * напрыклад, база дадзеных магла быць скінутая, выдаленая ці пашкоджаная.
 *
 * Карыстальнік мусіць вырашыць, што рабіць з такімі фотамі:
 * - аднавіць іх у IndexedDB
 * - або выдаліць з сервера
 *
 * Выкарыстоўваецца для двухбаковага параўнання стану лакальнай і сервернай базы.
 */
    async getOrphanedServerPhotos(): Promise<Photo[]> {
        const serverPhotos = await this.photoSync.getServerPhotos();
        const localPhotos = await this.photoDb.getAllPhotos();
        const localPhotoIds = new Set(localPhotos.map(p => String(p.id)));

        return serverPhotos.filter(p => !localPhotoIds.has(String(p.id)));
    }

    /**
 * Верне галерэі з сервера, якіх няма ў IndexedDB (арфанскія).
 */
    private async getOrphanedServerGalleries(): Promise<Gallery[]> {
        const serverGalleries = await firstValueFrom(this.galleryApi.getGalleries());
        const localGalleries = await this.galleryDb.getAllGalleries();

        const localIds = new Set(localGalleries.map(g => g.id));

        // 4. Фільтруем тыя, якіх няма лакальна
        const orphaned = serverGalleries.filter(g => !localIds.has(g.id));

        this.logger.log('--s', '🧪 ReconciliationService: знойдзены арфанскія галерэі:', orphaned);

        return orphaned;
    }


    // ReconciliationService.ts

    private async storeOrphanedServerGalleries(): Promise<void> {
        const orphaned = await this.getOrphanedServerGalleries();
        if (orphaned.length === 0) return;

        // 1. Пытаемся ў карыстальніка праз дыялог
        const shouldRestore = await firstValueFrom(
            this.dialog.open(OrphanedConfirmDialogComponent, {
                data: {
                    title: 'Аднаўленне галерэй',
                    message: `На серверы знойдзены ${orphaned.length} галерэі, якіх няма ў лакальнай базе. Аднавіць іх?`,
                    confirmText: 'Аднавіць',
                    cancelText: 'Прапусьціць'
                }
            }).afterClosed()
        );

        if (!shouldRestore) {
            this.logger.log('--s', '🟡 Карыстальнік адмовіўся аднаўляць арфанскія галерэі');
            return;
        }

        // 2. Захоўваем кожную галерэю ў IndexedDB
        for (const gallery of orphaned) {
            await this.galleryDb.addGallery({ ...gallery, isSynced: true });
        }

        this.logger.log('--s', '✅ Арфанскія галерэі захаваны лакальна:', orphaned);

        // 3. Абнаўляем state
        const updated = await this.galleryDb.getAllGalleries();
        this.galleryState.setGalleries(updated);
    }

}
