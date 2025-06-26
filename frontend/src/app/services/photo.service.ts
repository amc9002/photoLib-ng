import { Injectable } from '@angular/core';
import { Photo } from "../models/photo";
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { PhotoApiService } from './photo-api.service';
import { MockPhotoService } from './mock-photo.service';
import { LoadingService } from './loading.service';
import { PhotoIndexedDbService } from './photo-of-indexedDB.service';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private photos: Photo[] = [];
  private photosSubject = new BehaviorSubject<Photo[]>([]);
  photos$ = this.photosSubject.asObservable(); // public sibscriction

  setPhotos(photos: Photo[]) {
    console.log("📸 setPhotos:", photos.map(p => ({
      id: p.id,
      file: p.file,
      url: p.url
    })));
    this.photosSubject.next(photos);
  }

  private useMock = false;

  constructor(
    private loadingService: LoadingService,
    private apiService: PhotoApiService,
    private mockService: MockPhotoService,
    private storageService: PhotoIndexedDbService
  ) {
    this.loadPhotos(); // загрузка пры ініцыялізацыі
  }

  async loadPhotosFromStorage(): Promise<void> {
    try {
      const photosFromStorage = await this.storageService.getAllPhotos();
      console.log('PhotoService: All photos from storage:', photosFromStorage);
      this.photos = photosFromStorage;
      this.photosSubject.next([...this.photos]);
    } catch (error) {
      console.error('PhotoService: Error loading photos from IndexedDB:', error);
    }
  }

  private loadPhotos(): void {
    this.apiService.getPhotos().subscribe({
      next: (data) => {
        this.useMock = false;
        this.photos = data;
        this.photosSubject.next([...this.photos]);
      },
      error: async (error) => {
        console.warn("⚠️ PhotoService: Backend is unaccessible, using mock-photos:", error.message);
        this.useMock = true;
        await this.loadPhotosFromStorage();
        if (!this.photos.length) {
          // Калі IndexedDB пусты, выкарыстоўваем mock
          this.photos = this.mockService.getMockPhotos();
          this.photosSubject.next([...this.photos]);
        }
      }
    });
  }

  getPhotos(): Photo[] {
    return this.photos;
  }

  async addPhoto(file: File): Promise<void> {
    if (this.useMock) {
      const newPhoto = this.mockService.addMockPhoto(file);
      this.photos.push(newPhoto);
      this.photosSubject.next([...this.photos]);
    } else {
      const formData = new FormData();
      formData.append('ImageFile', file); // ВАЖНА: 'ImageFile' павінна адпавядаць DTO на бэкендзе
      formData.append('Title', 'Title from frontend');
      formData.append('Description', 'Photo was added with Angular');
      const exifData = await this.storageService.extractExifData(file); // ты ўжо маеш гэты метад у PhotoIndexedDbService
      formData.append('ExifData', JSON.stringify(exifData ?? {})); // гарантаваны JSON-радок

      this.loadingService.show(); // паказаць спінэр

      this.apiService.uploadPhoto(formData).subscribe({
        next: (response) => {
          console.log('✅ PhotoService: Photo is added to database: ID =', response.id);
          const newPhoto: Photo = {
            id: response.id,
            fileName: response.name,
            url: 'data:image/jpeg;base64,' + response.imageBase64,
            description: response.description,
            exifData: response.exifData,
            source: 'backend',
            isSynced: true,
            isModified: false,
            isDeleted: false
          };
          this.photos.push(newPhoto);
          this.photosSubject.next([...this.photos]);
          this.loadingService.hide(); // схаваць спінэр
        },
        error: (error) => {
          console.warn("PhotoService: Server doesn't answer, fake photo adding:", error.message);
          this.useMock = true;
          const fallbackPhoto = this.mockService.addMockPhoto(file);
          this.photos.push(fallbackPhoto);
          this.photosSubject.next([...this.photos]);
          this.loadingService.hide(); // схаваць спінэр
        }
      });
    }
  }

  updatePhotoDescription(id: number, description: string): void {
    this.apiService.updatePhotoDescription(id, description).subscribe({
      next: () => {
        const index = this.photos.findIndex(p => p.id === id);
        if (index >= 0) {
          this.photos[index].description = description;
          this.photosSubject.next([...this.photos]);
        }
        console.log(`✅ PhotoService: Photo description updated: ID = ${id}`);
      },
      error: (error) => {
        console.warn("PhotoService: Server update failed, fallback to mock update:", error.message);
        const index = this.photos.findIndex(p => p.id === id);
        if (index >= 0) {
          this.photos[index].description = description;
          this.photosSubject.next([...this.photos]);
        }
      }
    });
  }


  deletePhoto(photoToDelete: Photo): void {
    console.log("PhotoService: Current photos:", this.photos.map(p => p.id));
    console.log("PhotoService: Looking for", photoToDelete.id);
    const index = this.photos.findIndex(p => p.id === photoToDelete.id);
    if (index >= 0) {
      this.photos.splice(index, 1);
      this.photosSubject.next([...this.photos]); // апублікаваць новы стан
    }
    console.log("PhotoService: Current photos:", this.photos.map(p => p.id));
  }
}

