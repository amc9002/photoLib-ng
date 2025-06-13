import { Injectable } from '@angular/core';
import { Photo } from "../models/photo";
import { photos as mockPhotos } from "../data/mock-photo";
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private apiUrl = 'https://localhost:5171/api/photos';

  // constructor() { }

  // private photos: Photo[] = [...mockPhotos]; //fake photos
  private photos: Photo[] = [];
  // private photosSubject = new BehaviorSubject<Photo[]>(this.photos);
  private photosSubject = new BehaviorSubject<Photo[]>([]);

  photos$ = this.photosSubject.asObservable(); // public sibscriction

  constructor(private http: HttpClient) {
    this.loadPhotos(); // загрузка пры ініцыялізацыі
  }

  private loadPhotos(): void {
    this.http.get<Photo[]>( this.apiUrl ).subscribe((data) => {
      this.photos = data;
      this.photosSubject.next([ ...this.photos ]);
    });
  }

  getPhotos(): Photo[] {
    return this.photos;
  }

  addPhoto(file: File): Photo {
  const newId = this.photos.length > 0 ? Math.max(...this.photos.map(p => p.id)) + 1 : 1;
  const newPhoto: Photo = {
    id: newId,
    url: URL.createObjectURL(file), // show in browser
    description: 'Новае фота',
  };
  this.photos.push(newPhoto);
  this.photosSubject.next([...this.photos]); // renew the stream
  return newPhoto;
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

