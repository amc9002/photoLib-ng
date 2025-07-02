import { Injectable } from '@angular/core';
import { Photo } from '../models/photo-interfaces';
import { PhotoIndexedDbService } from './photo-of-indexedDB.service';
import { PhotoApiService } from './photo-api.service';
import { firstValueFrom } from 'rxjs';
import { PhotoBuilderService } from './photo-builder.service';

interface SyncOptions {
    fullReconcile?: boolean;
    syncNew?: boolean;
    syncUpdated?: boolean;
    syncDeleted?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PhotoSyncService {
    constructor(
        private storage: PhotoIndexedDbService,
        private api: PhotoApiService,
        private photoBuilder: PhotoBuilderService
    ) { }

    async syncWithServer(options: SyncOptions = {}): Promise<void> {
        console.log('🔄 PhotoSyncService: запуск сінхранізацыі з параметрамі', options);

        // Калі fullReconcile не ўстаноўлены, праверыць, ці патрэбен reconcile
        if (options.fullReconcile === undefined || options.fullReconcile === false) {
            const needReconcile = await this.hasOrphanedLocalPhotos();
            if (needReconcile) {
                console.log('ℹ️ PhotoSyncService: reconcile патрэбен, запускаем reconcileLocalWithServer');
                await this.reconcileLocalWithServer();
            } else {
                console.log('ℹ️ PhotoSyncService: reconcile не патрэбен');
            }
        } else if (options.fullReconcile) {
            await this.reconcileLocalWithServer();
        }

        const unsyncedPhotosRaw = await this.storage.getPhotosForSync();
        const unsyncedPhotos: Photo[] = unsyncedPhotosRaw.filter(p => p.id !== undefined) as Photo[];


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

        for (const photo of unsyncedPhotos) {
            const matchedAction = actions.find(
                a => a.enabled && a.condition(photo)
            );
            if (matchedAction) {
                console.log(`🔁 Сінхранізуем фота id=${photo.id} → ${matchedAction.name}`);
                await matchedAction.action(photo);
            } else {
                console.log(`✅ Photo id=${photo.id} не патрабуе сінхранізацыі`);
            }
        }
    }


    private async syncNewPhoto(photo: Photo): Promise<Photo> {
        console.log('Sync new photo id=', photo.id);

        if (!photo.file) {
            console.warn(`❌ PhotoSyncService: Няма файла для фота id=${photo.id}`);
            throw new Error('No file to upload');
        }

        const formData = this.photoBuilder.buildFormData(photo, { includeFileName: true });

        try {
            const response = await firstValueFrom(this.api.uploadPhoto(formData));

            const serverId = response.id;
            if (!serverId) {
                console.error(`❌ PhotoSyncService: Сервер не вярнуў ID`);
                throw new Error('Server did not return ID after upload');
            }

            console.log(`📤 PhotoSyncService: Загружана фота. Сервер вярнуў ID = ${serverId}`);

            const updatedPhoto: Photo = {
                ...photo,
                id: serverId,
                isSynced: true,
                isModified: false
            };

            await this.storage.savePhotoWithId(serverId, updatedPhoto);

            if (photo.id !== serverId) {
                await this.storage.deletePhoto(photo.id);
            }

            return updatedPhoto;
        }
        catch (error) {
            console.error(`❌ PhotoSyncService: Памылка пры загрузцы фота id=${photo.id}`, error);
            throw error;
        }

    }

    private async syncUpdatedPhoto(photo: Photo): Promise<void> {
        console.log('Sync updated photo id=', photo.id);

        if (photo.id === undefined) {
            console.warn('❌ PhotoSyncService: Няма id у фота для абнаўлення');
            return;
        }

        try {
            const formData = this.photoBuilder.buildFormData(photo);

            console.log('📤 PhotoSyncService: Адпраўляем абноўленыя дадзеныя на сервер:');
            await firstValueFrom(this.api.updatePhoto(photo.id, formData));

            const photoToUpdate = this.photoBuilder.buildPhotoToUpdate(photo);

            // ✅ Абнаўляем IndexedDB: скідваем isModified, усталёўваем isSynced
            await this.storage.updatePhoto(photoToUpdate);

            console.log(`✅ PhotoSyncService: Фота абноўлена на сэрверы і ў IndexedDB (id=${photo.id})`);
        }
        catch (error) {
            console.error(`❌ PhotoSyncService: Памылка пры абнаўленні фота id=${photo.id}`, error);
        }
    }

    private async syncDeletedPhoto(photo: Photo): Promise<void> {
        console.log('Sync deleted photo id=', photo.id);
        try {
            // 1. Выдаляем на серверы
            await this.api.deletePhoto(photo.id);

            // 2. Выдаляем з IndexedDB
            await this.storage.deletePhoto(photo.id);

            console.log(`✅ Фота id=${photo.id} выдалена з сервера і IndexedDB`);
        } catch (error) {
            console.error(`❌ Памылка пры выдаленні фота id=${photo.id}`, error);
        }
    }

    private async reconcileLocalWithServer(): Promise<void> {
        console.log('PhotoSyncService: 🔁 reconcileLocalWithServer: старт');

        try {
            const serverPhotos = await firstValueFrom(this.api.getPhotos());
            const serverIds = new Set(serverPhotos.map(p => p.id));
            const localPhotos = await this.storage.getAllPhotos();

            const orphanedPhotos = localPhotos.filter(
                p => !serverIds.has(p.id) && !p.isDeleted
            );

            for (const photo of orphanedPhotos) {
                try {
                    console.log(`⚠️ reconcileLocalWithServer: арфанскае фота id=${photo.id}, пазначаем як несінхранізаванае`);

                    const serverPhoto = await this.syncNewPhoto(photo);

                    const updatedPhoto = {
                    ...photo,
                    isSynced: false,
                    isModified: true 
                };
                    await this.storage.updatePhoto(serverPhoto);
                }
                catch (error) {
                    console.error(`❌ reconcileLocalWithServer: памылка з фота id=${photo.id}`, error);
                }
            }

            console.log('✅ reconcileLocalWithServer: завершана');
        }
        catch (error) {
            console.error('❌ reconcileLocalWithServer: памылка', error);
        }
    }

    
    private async hasOrphanedLocalPhotos(): Promise<boolean> {
        // Атрымаць фоткі з сервера
        const serverPhotos = await firstValueFrom(this.api.getPhotos());
        const serverIds = new Set(serverPhotos.map(p => p.id));

        // Атрымаць лакальныя фоткі
        const localPhotos = await this.storage.getAllPhotos();

        // Праверыць, ці ёсць фоткі ў локальным сховішчы, якіх няма на серверы
        const orphanedPhotos = localPhotos.filter(p => !serverIds.has(p.id) && !p.isDeleted);

        // Калі ёсць такія — трэба reconcile
        return orphanedPhotos.length > 0;
    }

}
