import { Injectable } from '@angular/core';
import { Photo } from '../models/photo';

@Injectable({
  providedIn: 'root'
})
export class PhotoRepositoryService {

  constructor() { }

  async savePhoto(photo: Photo): Promise<number> {
    console.log('savePhoto:', photo);
    return Promise.resolve(1); // вяртае ідэнтыфікатар фота (напрыклад 1)
  }

  // Атрымаць усе фота (пакуль проста заглушка)
  async getAllPhotos(): Promise<Photo[]> {
    console.log('getAllPhotos called');
    return Promise.resolve([]);
  }
}
