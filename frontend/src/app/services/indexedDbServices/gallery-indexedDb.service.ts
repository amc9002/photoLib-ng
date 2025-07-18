import { Injectable } from '@angular/core';
import { Gallery } from '../../models/gallery-interfaces';
import { DB_NAME, STORE_NAMES } from '../../config/db-config';
import { LoggerService } from '../logger.service';
import { IndexedDbService } from './indexedDb.service';
import { ValidationService } from '../utilServices/validation.service';

// Тып для абнаўлення галерэі, які забараняе змену id
export type GalleryUpdate = Partial<Omit<Gallery, 'id'>>;

export interface IGalleryIndexedDbService {
    getAllGalleries(): Promise<Gallery[]>;
    getGalleriesForSync(): Promise<Gallery[]>;
    addGallery(gallery: Gallery): Promise<number>;
    updateGallery(id: number, updates: GalleryUpdate): Promise<void>;
    deleteGalleryById(id: number): Promise<void>;
    replaceGalleryId(oldId: number, newGallery: Gallery): Promise<void>;
    getGalleriesByIds(galleryIds: number[]): Promise<Gallery[]>;
}

@Injectable({ providedIn: 'root' })
export class GalleryIndexedDbService implements IGalleryIndexedDbService {
    private readonly dbName = DB_NAME;
    private readonly storeName = STORE_NAMES.GALLERIES;

    constructor(
        private logger: LoggerService,
        private validationService: ValidationService,
        private indexedDbService: IndexedDbService
    ) { }

    /**
     * Retrieves all galleries from IndexedDB.
     * @returns A promise resolving to an array of Gallery objects.
     */
    async getAllGalleries(): Promise<Gallery[]> {
        return this.executeStoreOperation('readonly', store =>
            new Promise<Gallery[]>((resolve, reject) => {
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result as Gallery[]);
                req.onerror = () => reject(req.error);
            }),
            'retrieve galleries'
        );
    }

    /**
     * Retrieves galleries that are not yet synced with the server (isSynced === false).
     * @returns A promise resolving to an array of unsynced Gallery objects.
     */
    async getGalleriesForSync(): Promise<Gallery[]> {
        const all = await this.getAllGalleries();
        const unsynced = all.filter(g => !g.isSynced);
        this.logger.log('--s', 'GalleryIndexedDbService: Retrieved unsynced galleries', { count: unsynced.length });
        return unsynced;
    }

    /**
     * Adds a new gallery to IndexedDB.
     * @param gallery The gallery object to add.
     * @returns A promise resolving to the ID of the added gallery.
     */
    async addGallery(gallery: Gallery): Promise<number> {
        const preparedGallery = this.prepareGallery(gallery, 'add');
        this.validationService.validateGallery(preparedGallery, 'add');
        return this.executeStoreOperation('readwrite', store =>
            new Promise<number>((resolve, reject) => {
                const req = store.add(preparedGallery);
                req.onsuccess = () => {
                    const id = req.result;
                    if (typeof id === 'number') {
                        resolve(id);
                    } else {
                        reject(new Error(`Invalid ID type: ${typeof id}`));
                    }
                };
                req.onerror = () => reject(req.error);
            }),
            `add gallery ${preparedGallery.name}`
        );
    }

    /**
     * Updates an existing gallery by ID.
     * @param id The ID of the gallery to update.
     * @param updates Partial gallery object with fields to update, excluding id.
     * @returns A promise that resolves when the update is complete.
     */
    async updateGallery(id: number, updates: GalleryUpdate): Promise<void> {
        return this.executeStoreOperation('readwrite', async store => {
            const existing = await new Promise<Gallery | undefined>((resolve, reject) => {
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });

            if (!existing) throw new Error(`Gallery with id ${id} not found`);

            const updated = this.prepareGallery({ ...existing, ...updates, id }, 'update');
            this.validationService.validateGallery(updated, 'update');

            await new Promise<void>((resolve, reject) => {
                const req = store.put(updated);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        }, `update gallery id=${id}`);
    }

    /**
     * Deletes a gallery by ID.
     * @param id The ID of the gallery to delete.
     * @returns A promise that resolves when the deletion is complete.
     */
    async deleteGalleryById(id: number): Promise<void> {
        return this.executeStoreOperation('readwrite', store =>
            new Promise<void>((resolve, reject) => {
                const req = store.delete(id);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            }),
            `delete gallery id=${id}`
        );
    }

    /**
     * Replaces a gallery with a new one, deleting the old gallery.
     * @param oldId The ID of the gallery to replace.
     * @param newGallery The new gallery object.
     * @returns A promise that resolves when the replacement is complete.
     */
    async replaceGalleryId(oldId: number, newGallery: Gallery): Promise<void> {
        const preparedGallery = this.prepareGallery(newGallery, 'replace');
        this.validationService.validateGallery(preparedGallery, 'replace');
        return this.executeStoreOperation('readwrite', async store => {
            await new Promise<void>((resolve, reject) => {
                const req = store.delete(oldId);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });

            await new Promise<void>((resolve, reject) => {
                const req = store.add(preparedGallery);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        }, `replace gallery id=${oldId} with id=${preparedGallery.id}`);
    }

    /**
     * Retrieves galleries by their IDs.
     * @param galleryIds Array of gallery IDs.
     * @returns A promise resolving to an array of Gallery objects.
     */
    async getGalleriesByIds(galleryIds: number[]): Promise<Gallery[]> {
        return this.executeStoreOperation('readonly', async store => {
            const allGalleries = await new Promise<Gallery[]>((resolve, reject) => {
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result as Gallery[]);
                req.onerror = () => reject(req.error);
            });
            return allGalleries.filter(g => galleryIds.includes(g.id));
        }, `retrieve galleries by IDs: ${galleryIds.join(', ')}`);
    }

    /**
     * Executes a transaction on the IndexedDB store with error handling and logging.
     * @param mode The transaction mode ('readonly' or 'readwrite').
     * @param operation The operation to perform on the store.
     * @param operationName The name of the operation for logging purposes.
     * @returns A promise resolving to the result of the operation.
     * @throws Error if the operation fails or returns invalid data.
     */
    private async executeStoreOperation<T>(
        mode: IDBTransactionMode,
        operation: (store: IDBObjectStore) => Promise<T>,
        operationName: string
    ): Promise<T> {
        try {
            const result = await this.indexedDbService.performTransaction<T>(
                this.dbName,
                this.storeName,
                mode,
                operation
            );
            if (operationName.includes('retrieve galleries') && Array.isArray(result)) {
                if (result.some(item => !item || typeof item.id !== 'number' || typeof item.name !== 'string')) {
                    throw new Error(`Invalid gallery data returned from ${operationName}`);
                }
            }
            this.logger.log('--s', `GalleryIndexedDbService: Successfully completed ${operationName}`, { result });
            return result;
        } catch (error) {
            this.logger.error('--s', `GalleryIndexedDbService: Failed to ${operationName}`, error);
            throw error;
        }
    }

    /**
     * Prepares a gallery object for the specified operation by initializing fields.
     * @param gallery The gallery object to prepare.
     * @param mode The operation mode ('add', 'update', 'replace').
     * @returns A prepared Gallery object with initialized fields.
     */
    private prepareGallery(gallery: Gallery, mode: 'add' | 'update' | 'replace'): Gallery {
        const now = new Date().toISOString();
        const prepared: Gallery = {
            id: gallery.id,
            name: gallery.name,
            photoIds: gallery.photoIds ?? [], // Ініцыялізацыя, калі undefined
            creator: gallery.creator ?? 'Unknown', // Ініцыялізацыя, калі undefined
            createdAt: mode === 'add' ? (gallery.createdAt ?? now) : gallery.createdAt, // Усталёўваем толькі для 'add'
            updatedAt: mode === 'replace' ? gallery.updatedAt : (gallery.updatedAt ?? now), // Не абнаўляем для 'replace'
            isSynced: gallery.isSynced ?? false,
            isHidden: gallery.isHidden ?? false
        };

        if (mode === 'add' && !gallery.id) {
            // Генерацыя адмоўнага ID для новай галерэі
            prepared.id = -Math.floor(Math.random() * 1000000);
            prepared.isSynced = false;
        }

        return prepared;
    }
    
}