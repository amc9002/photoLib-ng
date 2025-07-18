import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { GalleryApiService } from '../apiServices/gallery-api.service';
import { Gallery, GalleryBase } from '../../models/gallery-interfaces';
import { GalleryStateService } from '../stateServices/gallery-state.service';
import { GalleryIndexedDbService } from '../indexedDbServices/gallery-indexedDb.service';
import { GallerySyncService } from '../syncServices/gallery-sync.service';
import { LoggerService } from '../logger.service';
import { STORE_NAMES } from '../../config/db-config';

@Injectable({ providedIn: 'root' })
export class GalleryManagerService {
  public galleries$: Observable<Gallery[]>;

  private readonly SELECTED_GALLERY_ID_KEY = 'selectedGalleryId';

  constructor(
    private logger: LoggerService,
    private api: GalleryApiService,
    private galleryState: GalleryStateService,
    private galleryDb: GalleryIndexedDbService,
    private gallerySync: GallerySyncService,
  ) {
    this.galleries$ = this.galleryState.galleries$;
  }

  defineObjectStore(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains(STORE_NAMES.GALLERIES)) {
      db.createObjectStore(STORE_NAMES.GALLERIES, { keyPath: 'id', autoIncrement: true });
      this.logger.log('--s', `🖼️ GalleryManagerService: Created store ${STORE_NAMES.GALLERIES}`);
    }
  }

  async loadInitialData(): Promise<void> {
    const galleries = await this.galleryDb.getAllGalleries();
    this.galleryState.setGalleries(galleries);
  }

  restoreSelectedGallery(): void {
    const storedSelectedId = localStorage.getItem('selectedGalleryId');
    const galleries = this.galleryState.getGalleriesSnapshot();
    const matched = storedSelectedId && galleries.find(g => g.id === Number(storedSelectedId));
    if (matched) {
      this.galleryState.setSelectedGallery(matched);
    } else if (galleries.length > 0) {
      this.galleryState.setSelectedGallery(galleries[0]);
    } else {
      this.galleryState.setSelectedGallery(null);
    }
  }

  getGalleries(): Gallery[] {
    return this.galleryState.getGalleriesSnapshot();
  }

  async loadGalleriesFromServer(): Promise<void> {
    try {
      const galleries = await firstValueFrom(this.api.getGalleries());
      this.logger.log('--s', 'GalleryManagerService.loadGalleriesFromServer:', galleries);
      this.galleryState.setGalleries(galleries);

      for (const gallery of galleries) {
      await this.galleryDb.addGallery(gallery);
    }
      const storedSelectedId = localStorage.getItem(this.SELECTED_GALLERY_ID_KEY);
      if (storedSelectedId && galleries.some(g => g.id === Number(storedSelectedId))) {
        this.setSelectedGalleryId(Number(storedSelectedId));
      } else if (galleries.length) {
        this.setSelectedGalleryId(galleries[0].id);
      } else {
        this.galleryState.setSelectedGallery(null);
      }
    } catch (error) {
      this.logger.error('--s', 'GalleryManagerService.loadGalleriesFromServer error:', error);
    }
  }

  async loadGalleriesFromIndexedDb(): Promise<void> {
    const galleriesFromDb = await this.galleryDb.getAllGalleries();
    this.logger.log('--s', 'GalleryManagerService: loaded galleries from IndexedDB:', galleriesFromDb);
    this.galleryState.setGalleries(galleriesFromDb);

    const storedSelectedId = localStorage.getItem(this.SELECTED_GALLERY_ID_KEY);
    if (storedSelectedId && galleriesFromDb.some(g => g.id === Number(storedSelectedId))) {
      this.setSelectedGalleryId(Number(storedSelectedId));
    } else if (galleriesFromDb.length > 0) {
      this.setSelectedGalleryId(galleriesFromDb[0].id);
    }
  }

  async syncGalleriesOnStartup(): Promise<void> {
    try {
      await this.gallerySync.syncUnsyncedGalleries();
    } catch (error) {
      this.logger.log('--s', 'GalleryManagerService: Sync failed:', error);
    }

    const galleriesAfterSync = await this.galleryDb.getAllGalleries();
    this.galleryState.setGalleries(galleriesAfterSync);
  }

  setSelectedGalleryId(id: number | null): void {
    if (id !== null) {
      this.galleryState.setSelectedGalleryId(id);
      localStorage.setItem(this.SELECTED_GALLERY_ID_KEY, id.toString());
    } else {
      this.galleryState.setSelectedGallery(null);
      localStorage.removeItem(this.SELECTED_GALLERY_ID_KEY);
    }
  }

  getSelectedGalleryId(): number | null {
    const gallery = this.galleryState.getSelectedGallery();
    return gallery ? gallery.id : null;
  }

  async addGallery(newGallery: GalleryBase): Promise<void> {
    // Дадаём у state і атрымліваем новую галерэю з id (часовы)
    const tempGallery = this.galleryState.addGallery(newGallery);

    // Захоўваем у IndexedDB
    await this.galleryDb.addGallery(tempGallery);

    // Сінхранізуем з серверам
    await this.gallerySync.syncUnsyncedGalleries();

    // Абнаўляем state з IndexedDB (калі id быў зменены пасля sync)
    const galleries = await this.galleryDb.getAllGalleries();
    this.galleryState.setGalleries(galleries);
  }

  async updateGallery(id: number, updates: Partial<Gallery>): Promise<void> {
    this.galleryState.updateGallery(id, updates);
    await this.galleryDb.updateGallery(id, updates);
  }

  async deleteGallery(id: number): Promise<void> {
    this.galleryState.deleteGalleryById(id);
    await this.galleryDb.deleteGalleryById(id);
  }

}
