import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Photo } from '../../models/photo-interfaces';

interface IPhotoStateService {
  getPhotosSnapshot(): Photo[];
  setPhotos(photos: Photo[]): void;
  addPhoto(photo: Photo): void;
  updatePhoto(id: number, newData: Partial<Photo>): void;
  deletePhoto(id: number): void;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoStateService implements IPhotoStateService {
  private photos: Photo[] = [];
  private photosSubject = new BehaviorSubject<Photo[]>([]);

  // Знешні Observable, да якога могуць падпісацца кампаненты
  photos$: Observable<Photo[]> = this.photosSubject.asObservable();

  getPhotosSnapshot(): Photo[] {
    return this.photosSubject.getValue();
  }

  // Загрузіць пачатковы стан фотак
  setPhotos(photos: Photo[]): void {
    this.photos = photos;
    this.photosSubject.next([...this.photos]);
  }

  // Дадаць новае фота
  addPhoto(photo: Photo): void {
    this.photos.push(photo);
    this.photosSubject.next([...this.photos]);
  }

  // Абнавіць фота па id
  updatePhoto(id: number, newData: Partial<Photo>) {
    const index = this.photos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.photos[index] = { ...this.photos[index], ...newData };
      this.photosSubject.next([...this.photos]);
    }
  }

  // Выдаліць фота па id
  deletePhoto(id: number): void {
    this.photos = this.photos.filter(p => p.id !== id);
    this.photosSubject.next([...this.photos]);
  }
}
