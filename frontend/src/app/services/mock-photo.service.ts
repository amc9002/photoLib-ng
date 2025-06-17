import { Injectable } from '@angular/core';
import { Photo } from '../models/photo';
import { photos as mockPhotos } from '../data/mock-photo';

@Injectable({
  providedIn: 'root'
})
export class MockPhotoService {
  private photos: Photo[] = [...mockPhotos];

  getMockPhotos(): Photo[] {
    return [...this.photos];
  }

  addMockPhoto(file: File): Photo {
    const newId = this.photos.length + 1;

      const newPhoto: Photo = {
      id: newId,
      fileName: "New name",
      url: URL.createObjectURL(file),
      description: 'New photo',
      source: 'mock',
      isSynced: false,
      isModified: false
    };
    this.photos.push(newPhoto);
    return newPhoto;
  }

  constructor() { }
}
