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
    const newId = this.photos.length > 0
      ? Math.max(...this.photos.map(p => p.id)) + 1
      : 1;

      const newPhoto: Photo = {
      id: newId,
      url: URL.createObjectURL(file),
      description: 'New photo',
      source: 'mock'
    };
    this.photos.push(newPhoto);
    return newPhoto;
  }

  constructor() { }
}
