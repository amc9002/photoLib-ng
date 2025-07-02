import { Injectable } from '@angular/core';
import { Photo, PhotoToStore, PhotoToUpdate } from '../models/photo-interfaces';
import { PhotoIndexedDbService } from './photo-of-indexedDB.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ExifExtractorService } from './exif-extractor.service';


@Injectable({
    providedIn: 'root'
})
export class PhotoBuilderService {
    constructor(
        private exifExtractor: ExifExtractorService,
        private sanitizer: DomSanitizer,
        private storage: PhotoIndexedDbService
    ) { }

    async buildPhotoToStoreFromFile(file: File): Promise<PhotoToStore> {
        const exifData = await this.exifExtractor.extractExifData(file);

        const photoToStore: PhotoToStore = {
            file,
            fileName: file.name,
            title: '',
            description: '',
            exif: exifData,
            isSynced: false,
            isDeleted: false,
            isModified: false
        };

        return photoToStore;
    }


    buildPhotoToStoreFromServer(
        serverPhoto: Partial<Photo>,
        file: File
    ): PhotoToStore {
        return {
            file,
            fileName: serverPhoto.fileName ?? file.name,
            title: serverPhoto.title ?? '',
            description: serverPhoto.description ?? '',
            exif: serverPhoto.exif ?? {},
            isSynced: true,
            isDeleted: false,
            isModified: false,
        };
    }


    async buildFromIndexedDbById(id: number | string): Promise<Photo> {
        const raw = await this.storage.getRawPhotoById(id); // Мы створым гэты метад ніжэй

        if (!raw) {
            throw new Error(`❌ PhotoBuilderService: не знойдзена фота з id=${id}`);
        }

        const blob = raw.file as Blob;
        const file = new File(
            [blob],
            raw.fileName || 'unknown',
            {
                type: blob.type,
                lastModified: raw.lastModified || Date.now()
            }
        );
        const objectUrl = URL.createObjectURL(blob);
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);

        const photo: Photo = {
            id,
            file,
            fileName: raw.fileName,
            title: raw.title ?? '',
            description: raw.description ?? '',
            exif: raw.exif ?? {},
            url: safeUrl as SafeUrl,
            isSynced: raw.isSynced ?? false,
            isDeleted: raw.isDeleted ?? false,
            isModified: raw.isModified ?? false
        };

        return photo;
    }


    buildPhotoDataForIndexedDb(photo: PhotoToStore): PhotoToStore {
        if (!photo.file) throw new Error('File is required');

        return {
            file: photo.file,
            fileName: photo.fileName,
            type: photo.file.type,
            date: new Date().toISOString(),
            description: photo.description || '',
            title: photo.title || '',
            exif: photo.exif || null,
            isSynced: photo.isSynced ?? false,
            isModified: photo.isModified ?? false,
            isDeleted: photo.isDeleted ?? false,
        };
    }


    buildPhotoDataForIndexedDbWithId(
        id: number | string,
        photo: PhotoToStore
    ): PhotoToStore & { id: number | string } {
        const base = this.buildPhotoDataForIndexedDb(photo);
        return {
            ...base,
            id
        };
    }


    buildPhotoToUpdate(photo: Photo): PhotoToUpdate {
        if (photo.id === undefined || photo.id === null) {
            throw new Error('Photo id is required for update');
        }
        return {
            id: photo.id,
            title: photo.title ?? '',
            description: photo.description ?? '',
            exif: photo.exif ?? null,
            isModified: false,
            isSynced: true,
            isDeleted: photo.isDeleted ?? false,
        };
    }


    buildFormData(photo: Photo, options?: { includeFileName?: boolean }): FormData {
        const formData = new FormData();

        if (photo.file) formData.append('ImageFile', photo.file);

        if (options?.includeFileName && photo.fileName) {
            formData.append('fileName', photo.fileName);
        }

        formData.append('title', photo.title?.trim() || '[Untitled]');
        formData.append('description', photo.description ?? '');
        formData.append('exifData', JSON.stringify(photo.exif ?? {}));

        return formData;
    }

}
