import { Injectable } from '@angular/core';
import { Photo, PhotoToUpdate } from '../models/photo-interfaces';
import { PhotoIndexedDbService } from './photo-of-indexedDB.service';
import { PhotoBuilderService } from './photo-builder.service';

@Injectable({ providedIn: 'root' })
export class PhotoDataService {
    constructor(
        private indexedDbService: PhotoIndexedDbService,
        private builder: PhotoBuilderService,
    ) { }

    async addNew(file: File): Promise<Photo> {
        try {
            console.log('📥 PhotoDataService: Захоўваем новае фота з файла', file.name);

            const photoToStore = await this.builder.buildPhotoToStoreFromFile(file);
            const id = await this.indexedDbService.saveNew(photoToStore);
            const builtPhoto = await this.builder.buildFromIndexedDbById(id);

            return builtPhoto;
        } catch (error) {
            console.error('❌ PhotoDataService: Памылка пры захоўванні фота:', error);
            throw error;
        }
    }

    async deletePhoto(photo: Photo): Promise<void> {
        if (photo.id === undefined) {
            console.warn('⚠️ PhotoDataService: Немагчыма выдаліць фота без id');
            return;
        }
        
        if (photo.isSynced) {
            const updated: PhotoToUpdate = {
                id: photo.id,
                isDeleted: true,
                isModified: true,
                isSynced: false
            };
            await this.indexedDbService.updatePhoto(updated);
        } else {
            await this.indexedDbService.deletePhoto(photo.id);
        }
    }


    async updatePhoto(id: number | string, newTitle: string, newDescription: string): Promise<void> {
        const allPhotos = await this.indexedDbService.getAllPhotos();
        const photo = allPhotos.find(p => p.id === id);

        if (!photo) {
            console.warn(`❌ PhotoDataService: Photo with id=${id} not found`);
            return;
        }

        photo.title = newTitle;
        photo.description = newDescription;

        if (photo.isSynced) {
            photo.isModified = true;
        }

        const photoToUpdate: PhotoToUpdate = {
            ...photo,
            id: photo.id!
        };

        await this.indexedDbService.updatePhoto(photoToUpdate);
    }


    // Тут будуць іншыя метады, напрыклад: deletePhoto, updatePhoto, syncPhotosWithServer і інш.
}
