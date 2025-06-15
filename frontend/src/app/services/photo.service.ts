import { Injectable } from '@angular/core';
import { Photo } from "../models/photo";
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { PhotoApiService } from './photo-api.service';
import { MockPhotoService } from './mock-photo.service';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private photos: Photo[] = [];
  private photosSubject = new BehaviorSubject<Photo[]>([]);
  photos$ = this.photosSubject.asObservable(); // public sibscriction

  private useMock = false;

  constructor(
    private loadingService: LoadingService,
    private apiService: PhotoApiService,
    private mockService: MockPhotoService
  ) {
    this.loadPhotos(); // загрузка пры ініцыялізацыі
  }

  private loadPhotos(): void {
    this.apiService.getPhotos().subscribe({
      next: (data) => {
        this.useMock = false;
        this.photos = data;
        this.photosSubject.next([...this.photos]);
      },
      error: (error) => {
        console.warn("⚠️ Backend is unaccessible, using mock-photos:", error.message);
        this.useMock = true;
        this.photos = this.mockService.getMockPhotos();
        this.photosSubject.next([...this.photos]);
      }
    });
  }

  getPhotos(): Photo[] {
    return this.photos;
  }

  addPhoto(file: File): void {
    if (this.useMock) {
      const newPhoto = this.mockService.addMockPhoto(file);
      this.photos.push(newPhoto);
      this.photosSubject.next([...this.photos]);
    } else {
      const formData = new FormData();
      formData.append('ImageFile', file); // ВАЖНА: 'ImageFile' павінна адпавядаць DTO на бэкендзе
      formData.append('Title', 'Title from frontend');
      formData.append('Description', 'Photo was added with Angular');
      formData.append('ExifData', '{}'); // пакуль пусты JSON

      this.loadingService.show(); // паказаць спінэр

      this.apiService.uploadPhoto(formData).subscribe({
        next: (response) => {
          console.log('✅ Photo is added to database: ID =', response.id);
          const newPhoto: Photo = {
            id: response.id,
            url: 'data:image/jpeg;base64,' + response.imageBase64,
            description: response.description,
            exif: response.exifData,
            source: 'backend'
          };
          this.photos.push(newPhoto);
          this.photosSubject.next([...this.photos]);
          this.loadingService.hide(); // схаваць спінэр
        },
        error: (error) => {
          console.warn("Server doesn't answer, fake photo adding:", error.message);
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
      console.log(`✅ Photo description updated: ID = ${id}`);
    },
    error: (error) => {
      console.warn("Server update failed, fallback to mock update:", error.message);
      const index = this.photos.findIndex(p => p.id === id);
      if (index >= 0) {
        this.photos[index].description = description;
        this.photosSubject.next([...this.photos]);
      }
    }
  });
}


  deletePhoto(photoToDelete: Photo): void {
    console.log("Current photos:", this.photos.map(p => p.id));
    console.log("Looking for", photoToDelete.id);
    const index = this.photos.findIndex(p => p.id === photoToDelete.id);
    if (index >= 0) {
      this.photos.splice(index, 1);
      this.photosSubject.next([...this.photos]); // апублікаваць новы стан
    }
    console.log("Current photos:", this.photos.map(p => p.id));
  }
}

