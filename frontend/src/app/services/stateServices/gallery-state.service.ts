import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Gallery, GalleryBase } from '../../models/gallery-interfaces';
import { LoggerService } from '../logger.service';
import { ValidationService } from '../utilServices/validation.service';

const SELECTED_GALLERY_ID_KEY = 'selectedGalleryId';

// Тып для абнаўлення галерэі, які забараняе змену id
export type GalleryUpdate = Partial<Omit<Gallery, 'id'>>;

// Інтэрфейс для GalleryStateService
export interface IGalleryStateService {
    galleries$: Observable<Gallery[]>;
    selectedGallery$: Observable<Gallery | null>;
    getGalleriesSnapshot(): Gallery[];
    setGalleries(galleries: Gallery[]): void;
    setSelectedGallery(gallery: Gallery | null): void;
    getSelectedGallery(): Gallery | null;
    setSelectedGalleryId(id: number): void;
    restoreSelectedGallery(): void;
    addGallery(newGallery: GalleryBase): Gallery;
    updateGallery(id: number, updatedFields: GalleryUpdate): void;
    deleteGalleryById(id: number): void;
}

@Injectable({
    providedIn: 'root'
})
export class GalleryStateService implements IGalleryStateService {
    private galleriesSubject = new BehaviorSubject<Gallery[]>([]);
    galleries$: Observable<Gallery[]> = this.galleriesSubject.asObservable();

    private selectedGallerySubject = new BehaviorSubject<Gallery | null>(null);
    selectedGallery$: Observable<Gallery | null> = this.selectedGallerySubject.asObservable();

    private nextTempGalleryId = -1;

    constructor(
        private logger: LoggerService,
        private validationService: ValidationService
    ) { }

    /**
     * Gets the current snapshot of galleries.
     * @returns An array of Gallery objects.
     */
    getGalleriesSnapshot(): Gallery[] {
        return this.galleriesSubject.getValue();
    }

    /**
     * Sets the full list of galleries in the state.
     * @param galleries The array of Gallery objects to set.
     */
    setGalleries(galleries: Gallery[]): void {
        this.executeStateOperation(
            () => {
                this.galleriesSubject.next([...galleries]);
                if (!this.getSelectedGallery()) {
                    this.restoreSelectedGallery();
                }
            },
            'set galleries',
            { galleries }
        );
    }

    /**
     * Sets the selected gallery.
     * @param gallery The Gallery object to select, or null to clear selection.
     */
    setSelectedGallery(gallery: Gallery | null): void {
        this.selectedGallerySubject.next(gallery);

        if (gallery) {
            this.logger.log('--s', 'GalleryStateService.setSelectedGallery: Saving gallery id to localStorage', { id: gallery.id });
            this.saveSelectedGalleryId(gallery.id);
        } else {
            this.logger.log('--s', 'GalleryStateService.setSelectedGallery: Clearing localStorage (no selected gallery)');
            this.clearSelectedGalleryId();
        }
    }

    /**
     * Gets the currently selected gallery.
     * @returns The selected Gallery object or null.
     */
    getSelectedGallery(): Gallery | null {
        return this.selectedGallerySubject.value;
    }

    /**
     * Sets the selected gallery by ID.
     * @param id The ID of the gallery to select.
     */
    setSelectedGalleryId(id: number): void {
        this.logger.log('--s', 'GalleryStateService.setSelectedGalleryId: Selecting gallery with id', { id });
        localStorage.setItem(SELECTED_GALLERY_ID_KEY, String(id));
        const gallery = this.getGalleriesSnapshot().find(g => String(g.id) === String(id));
        if (gallery) {
            this.logger.log('--s', 'GalleryStateService.setSelectedGalleryId: Found gallery', { gallery });
            this.setSelectedGallery(gallery);
            this.logger.log('--s', 'GalleryStateService.setSelectedGalleryId: Selected gallery with id', { id });
        } else {
            this.logger.warn('--s', 'GalleryStateService.setSelectedGalleryId: Gallery with id not found', { id });
            this.setSelectedGallery(null);
        }
    }

    /**
     * Restores the selected gallery from localStorage or selects the first available gallery.
     */
    restoreSelectedGallery(): void {
        const storedId = localStorage.getItem(SELECTED_GALLERY_ID_KEY);
        const galleries = this.getGalleriesSnapshot();

        if (storedId !== null) {
            const parsedId = Number(storedId);
            if (!isNaN(parsedId)) {
                if (galleries.some(g => g.id === parsedId)) {
                    this.logger.log('--s', 'GalleryStateService.restoreSelectedGallery: Restoring selected gallery from localStorage', { id: parsedId });
                    this.setSelectedGalleryId(parsedId);
                    return;
                } else {
                    this.logger.warn('--s', 'GalleryStateService.restoreSelectedGallery: Gallery with id from localStorage not found', { id: parsedId });
                }
            }
        }

        if (galleries.length > 0) {
            this.logger.log('--s', 'GalleryStateService.restoreSelectedGallery: Selecting first gallery as fallback', { id: galleries[0].id });
            this.setSelectedGallery(galleries[0]);
        } else {
            this.logger.log('--s', 'GalleryStateService.restoreSelectedGallery: Gallery list is empty, no selection set');
            this.setSelectedGallery(null);
        }
    }

    /**
     * Adds a new gallery to the state.
     * @param newGallery The partial gallery object to add.
     * @returns The created Gallery object with assigned ID and initialized fields.
     */
    addGallery(newGallery: GalleryBase): Gallery {
        return this.executeStateOperation<Gallery>(
            () => {
                const now = new Date().toISOString();
                const galleryWithId: Gallery = {
                    id: this.generateTempId(),
                    name: newGallery.name,
                    photoIds: newGallery.photoIds ?? [],
                    creator: newGallery.creator ?? 'Unknown',
                    createdAt: newGallery.createdAt ?? now,
                    updatedAt: newGallery.updatedAt ?? now,
                    isSynced: newGallery.isSynced ?? false,
                    isHidden: newGallery.isHidden ?? false
                };
                this.validationService.validateGallery(galleryWithId, 'add');
                const current = this.galleriesSubject.getValue();
                this.galleriesSubject.next([...current, galleryWithId]);
                return galleryWithId;
            },
            'add gallery',
            { name: newGallery.name }
        );
    }

    /**
     * Updates a gallery in the state by ID.
     * @param id The ID of the gallery to update.
     * @param updatedFields Partial gallery fields to update, excluding id.
     */
    updateGallery(id: number, updatedFields: GalleryUpdate): void {
        this.executeStateOperation(
            () => {
                const now = new Date().toISOString();
                const current = this.getGalleriesSnapshot();
                const updated = current.map(g =>
                    g.id === id ? { ...g, ...updatedFields, updatedAt: updatedFields.updatedAt ?? now } : g
                );
                const updatedGallery = updated.find(g => g.id === id);
                if (updatedGallery) {
                    this.validationService.validateGallery(updatedGallery, 'update');
                }
                this.galleriesSubject.next(updated);
            },
            'update gallery',
            { id, updatedFields }
        );
    }

    /**
     * Deletes a gallery from the state by ID.
     * @param id The ID of the gallery to delete.
     */
    deleteGalleryById(id: number): void {
        this.executeStateOperation(
            () => {
                const current = this.getGalleriesSnapshot();
                const updated = current.filter(g => g.id !== id);
                this.galleriesSubject.next(updated);
                const currentSelected = this.getSelectedGallery();
                if (currentSelected?.id === id) {
                    this.setSelectedGallery(null);
                }
            },
            'delete gallery',
            { id }
        );
    }

    /**
     * Executes a state operation with logging and error handling.
     * @param operation The operation to perform on the state.
     * @param operationName The name of the operation for logging purposes.
     * @param logContext Additional context for logging.
     * @returns The result of the operation, if any.
     * @throws Error if the operation fails.
     */
    private executeStateOperation<T = void>(
        operation: () => T,
        operationName: string,
        logContext: object = {}
    ): T {
        try {
            const result = operation();
            this.logger.log('--s', `GalleryStateService: Successfully completed ${operationName}`, { ...logContext, result });
            return result;
        } catch (error) {
            this.logger.error('--s', `GalleryStateService: Failed to ${operationName}`, { ...logContext, error });
            throw error;
        }
    }

    /**
     * Generates a temporary negative ID for a new gallery.
     * @returns A negative number to use as a temporary ID.
     */
    private generateTempId(): number {
        return this.nextTempGalleryId--;
    }

    /**
     * Saves the selected gallery ID to localStorage.
     * @param id The ID of the gallery to save.
     */
    private saveSelectedGalleryId(id: number): void {
        localStorage.setItem(SELECTED_GALLERY_ID_KEY, id.toString());
    }

    /**
     * Clears the selected gallery ID from localStorage.
     */
    private clearSelectedGalleryId(): void {
        localStorage.removeItem(SELECTED_GALLERY_ID_KEY);
    }
}