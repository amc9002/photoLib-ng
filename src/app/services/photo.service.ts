import { Injectable } from '@angular/core';
import { Photo } from "../models/photo";
import { photos as mockPhotos } from "../data/mock-photo";
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  constructor() { }

  private photos: Photo[] = [...mockPhotos];
  private photosSubject = new BehaviorSubject<Photo[]>(this.photos);

  photos$ = this.photosSubject.asObservable(); // публічная падпіска

  getPhotos(): Photo[] {
    return this.photos;
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

