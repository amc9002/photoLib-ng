import { Injectable } from '@angular/core';
import { Gallery } from '../../models/gallery-interfaces';

// Інтэрфейс для ValidationService
export interface IValidationService {
    validateGallery(gallery: Gallery, mode: 'add' | 'update' | 'replace'): void;
    // Дадаць метады для фота і стрымаў у будучыні, напрыклад:
    // validatePhoto(photo: Photo, mode: 'add' | 'update' | 'replace'): void;
    // validateStream(stream: Stream, mode: 'add' | 'update' | 'replace'): void;
}

@Injectable({
    providedIn: 'root'
})
export class ValidationService implements IValidationService {
    /**
     * Validates a gallery object to ensure it meets the required structure.
     * @param gallery The gallery object to validate.
     * @param mode The operation mode ('add', 'update', 'replace') for specific validation rules.
     * @throws Error if the gallery object is invalid.
     */
    validateGallery(gallery: Gallery, mode: 'add' | 'update' | 'replace' = 'add'): void {
        if (!gallery) throw new Error('Gallery is required');

        const validators: Record<string, () => void> = {
            name: () => {
                if (typeof gallery.name !== 'string' || gallery.name.trim().length === 0) {
                    throw new Error('Gallery name must be a non-empty string');
                }
            },
            photoIds: () => {
                if (gallery.photoIds && (!Array.isArray(gallery.photoIds) || gallery.photoIds.some(id => typeof id !== 'number'))) {
                    throw new Error('Gallery photoIds must be an array of numbers or undefined');
                }
            },
            creator: () => {
                if (gallery.creator && typeof gallery.creator !== 'string') {
                    throw new Error('Gallery creator must be a string or undefined');
                }
            },
            createdAt: () => {
                if (gallery.createdAt && (typeof gallery.createdAt !== 'string' || isNaN(Date.parse(gallery.createdAt)))) {
                    throw new Error('Gallery createdAt must be a valid ISO date string or undefined');
                }
            },
            updatedAt: () => {
                if (gallery.updatedAt && (typeof gallery.updatedAt !== 'string' || isNaN(Date.parse(gallery.updatedAt)))) {
                    throw new Error('Gallery updatedAt must be a valid ISO date string or undefined');
                }
            },
            isSynced: () => {
                if (typeof gallery.isSynced !== 'boolean') {
                    throw new Error('Gallery isSynced must be a boolean');
                }
            },
            isHidden: () => {
                if (typeof gallery.isHidden !== 'boolean') {
                    throw new Error('Gallery isHidden must be a boolean');
                }
            },
            id: () => {
                if (typeof gallery.id !== 'number') {
                    throw new Error('Gallery id must be a number');
                }
                if (mode === 'add' && gallery.id >= 0) {
                    throw new Error('Gallery id must be negative for add operation');
                }
                if (mode === 'update' && gallery.id <= 0) {
                    throw new Error('Gallery id must be a positive number for update');
                }
            }
        };

        Object.keys(validators).forEach(field => validators[field]());
    }
}