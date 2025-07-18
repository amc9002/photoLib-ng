// photo-filter.service.ts
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, tap } from 'rxjs';
import { Photo } from '../../models/photo-interfaces';
import { PhotoStateService } from '../stateServices/photo-state.service';
import { GalleryStateService } from '../stateServices/gallery-state.service';
import { LoggerService } from '../logger.service';


interface IPhotoFilterService {
    getPhotosForSelectedGallery(): Observable<Photo[]>;
    filterByGalleryId(photos: Photo[], galleryId: number | null): Photo[];
}

@Injectable({ providedIn: 'root' })
export class PhotoFilterService implements IPhotoFilterService {
    constructor(
        private logger: LoggerService,
        private photoState: PhotoStateService,
        private galleryState: GalleryStateService
    ) { }

    /** 📸 Верне фоткі для выбранай галерэі */
    getPhotosForSelectedGallery(): Observable<Photo[]> {
        return combineLatest([
            this.photoState.photos$,
            this.galleryState.selectedGallery$.pipe(
                map(gallery => gallery?.id ?? null)
            )
        ]).pipe(
            tap(([selectedId]) => {
                this.logger.log('--s', '📋 PhotoFilterService: selectedGalleryId =', selectedId);
            }),
            map(([photos, selectedId]) => {
                this.logger.log('--s', '🧪 PhotoFilterService: Filtering photos:', { selectedId, photos });
                if (!selectedId) return [];
                return photos.filter(p => {
                    const match = String(p.galleryId) === String(selectedId);
                    this.logger.log('--s', '🔎 PhotoFilterService: Checking photo:', {
                        photoId: p.id,
                        photoGalleryId: p.galleryId,
                        selectedGalleryId: selectedId,
                        match
                    });
                    if (!match) {
                        this.logger.warn('--s', '🚫 PhotoFilterService: Skipped (galleryId mismatch):', {
                            photoId: p.id,
                            photoGalleryId: p.galleryId,
                            selectedId
                        });
                    }
                    return match;
                });
            })
        );
    }

    filterByGalleryId(photos: Photo[], galleryId: number | null): Photo[] {
        if (!galleryId) return []; // Калі галерэя не выбрана — не паказваць нічога
        return photos.filter(photo => String(photo.galleryId) === String(galleryId));
    }
}
